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

  constructor(
    private readonly contracts: ContractsService,
    private readonly config: ConfigService,
  ) {
    this.secret = this.config.get<string>('UCANSIGN_WEBHOOK_SECRET');
    this.headerName =
      this.config.get<string>('UCANSIGN_WEBHOOK_SIGNATURE_HEADER') ??
      'x-ucansign-signature';

    if (!this.secret && this.isProduction()) {
      this.logger.error(
        'UCANSIGN_WEBHOOK_SECRET unset under NODE_ENV=production — webhook will reject all calls.',
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
    } else if (this.isProduction()) {
      throw new UnauthorizedException(
        'Webhook signature verification not configured',
      );
    }

    const parsed = UCanSignWebhookSchema.safeParse(body);
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
}
