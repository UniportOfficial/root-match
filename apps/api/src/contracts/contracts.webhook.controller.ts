import {
  Body,
  Controller,
  Headers,
  HttpCode,
  InternalServerErrorException,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { ContractsService } from './contracts.service';
import { UCanSignWebhookSchema } from './dto/ucansign-webhook.schema';

type WebhookRequest = Request & { rawBody?: Buffer };

/**
 * Vendor webhook receiver.
 * Reference: docs/specs/ucansign-api-reference.md §2.8 + §5.5 + §8.3
 *
 * Verification policy:
 *  1. UCANSIGN_WEBHOOK_SECRET set → HMAC-SHA256 over the raw request bytes
 *     using the header named by UCANSIGN_WEBHOOK_SIGNATURE_HEADER
 *     (default `x-ucansign-signature`). Mismatch / missing header → 401.
 *  2. UCANSIGN_WEBHOOK_SECRET unset + NODE_ENV=production → 401 (fail-safe).
 *  3. UCANSIGN_WEBHOOK_SECRET unset + non-production → verification skipped;
 *     security boundary degrades to customValue5 mapping + idempotency hash
 *     (§8.3 fallback for dev/test before vendor provisions a secret).
 *
 * Idempotency: every accepted webhook is keyed by sha256(rawBody) into
 * WebhookEvent (UNIQUE payload_hash). Vendor retries collide on insert and
 * return the prior matched response without re-applying state mutations.
 *
 * NOTE: this endpoint is intentionally NOT guarded by BetterAuthGuard —
 * vendor calls it with no session cookie. HMAC + customValue + idempotency
 * are the security boundary.
 */
@Controller('webhooks/ucansign')
export class ContractsWebhookController {
  private readonly logger = new Logger(ContractsWebhookController.name);
  private readonly secret: string | undefined;
  private readonly headerName: string;
  private readonly allowUnsigned: boolean;

  constructor(
    private readonly contracts: ContractsService,
    private readonly config: ConfigService,
  ) {
    this.secret = this.config.get<string>('UCANSIGN_WEBHOOK_SECRET');
    this.headerName =
      this.config.get<string>('UCANSIGN_WEBHOOK_SIGNATURE_HEADER') ??
      'x-ucansign-signature';
    this.allowUnsigned =
      this.config.get<string>('UCANSIGN_ALLOW_UNSIGNED_WEBHOOK') === 'true';

    if (!this.secret && this.isProduction() && !this.allowUnsigned) {
      this.logger.error(
        'UCANSIGN_WEBHOOK_SECRET unset under NODE_ENV=production — webhook will reject all calls. Set UCANSIGN_ALLOW_UNSIGNED_WEBHOOK=true to opt-in to customValue5 fallback.',
      );
    }

    if (!this.secret && this.allowUnsigned) {
      this.logger.warn(
        'UCANSIGN_ALLOW_UNSIGNED_WEBHOOK=true — webhook signature verification skipped. Security boundary relies on customValue5 + idempotency hash only.',
      );
    }
  }

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: WebhookRequest,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ): Promise<{ matched: boolean; contractId?: string }> {
    const rawBuffer = req.rawBody;
    if (!rawBuffer) {
      this.logger.error(
        'rawBody not captured — bootstrap captureRawBodyForWebhooks middleware missing',
      );
      throw new InternalServerErrorException('Raw body not captured');
    }

    if (this.secret) {
      this.verifySignature(headers, rawBuffer);
    } else if (this.isProduction() && !this.allowUnsigned) {
      throw new UnauthorizedException(
        'Webhook signature verification not configured',
      );
    }

    const safeBody = this.reparsePreservingBigIntStrings(rawBuffer, body);
    const parsed = UCanSignWebhookSchema.safeParse(safeBody);
    if (!parsed.success) {
      this.logger.warn(
        `Unparseable UCanSign webhook payload: ${parsed.error.message}`,
      );
      return { matched: false };
    }

    const payloadHash = createHash('sha256').update(rawBuffer).digest('hex');
    this.logger.log(
      `Webhook eventType=${parsed.data.eventType} documentId=${parsed.data.documentId} payloadHash=${payloadHash.slice(0, 12)}`,
    );
    return this.contracts.handleWebhookIdempotent(parsed.data, payloadHash);
  }

  private verifySignature(
    headers: Record<string, string | string[] | undefined>,
    rawBuffer: Buffer,
  ): void {
    if (!this.secret) return;

    const headerValue = headers[this.headerName.toLowerCase()];
    const providedHex = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    if (!providedHex) {
      throw new UnauthorizedException(
        `Missing webhook signature header: ${this.headerName}`,
      );
    }

    const computedHex = createHmac('sha256', this.secret)
      .update(rawBuffer)
      .digest('hex');

    const providedBuf = Buffer.from(providedHex, 'hex');
    const computedBuf = Buffer.from(computedHex, 'hex');

    if (
      providedBuf.length !== computedBuf.length ||
      !timingSafeEqual(providedBuf, computedBuf)
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  private isProduction(): boolean {
    return (
      (this.config.get<string>('NODE_ENV') ?? process.env.NODE_ENV) ===
      'production'
    );
  }

  /**
   * UCanSign sends IDs as unquoted JSON numbers exceeding 2^53; native
   * JSON.parse (which express.json already ran) silently loses precision.
   * Re-parse the raw bytes after quoting 16+ digit integers so IDs survive
   * as strings. Falls back to the express-parsed body on parse failure.
   */
  private reparsePreservingBigIntStrings(
    rawBuffer: Buffer,
    fallback: unknown,
  ): unknown {
    try {
      const text = rawBuffer.toString('utf8');
      const safeText = text.replace(/:\s*(\d{16,})(?=[,\s}\]])/g, ':"$1"');
      return JSON.parse(safeText);
    } catch (error) {
      this.logger.warn(
        `Bigint-safe re-parse failed, using express-parsed body: ${(error as Error).message}`,
      );
      return fallback;
    }
  }
}
