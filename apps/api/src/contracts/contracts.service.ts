import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type {
  Contract,
  ContractParticipant,
  ContractStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateContractInput,
  SendContractInput,
} from './dto/create-contract.dto';
import type { UCanSignWebhookPayload } from './dto/ucansign-webhook.schema';
import {
  CONTRACT_GATEWAY,
  type ContractGateway,
  type GatewayParticipant,
} from './gateway/contract-gateway.interface';

export type ContractParticipantStatus = 'need_signing' | 'completed';

export type ContractRecord = Contract & {
  participants: ContractParticipant[];
};

interface CancelContractOptions {
  reason?: string;
}

const CONTRACT_INCLUDE = {
  participants: {
    orderBy: { signingOrder: 'asc' as const },
  },
} satisfies Prisma.ContractInclude;

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    @Inject(CONTRACT_GATEWAY) private readonly gateway: ContractGateway,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    input: CreateContractInput,
  ): Promise<ContractRecord> {
    const contractId = randomUUID();

    const record = await this.prisma.contract.create({
      data: {
        id: contractId,
        ownerUserId: userId,
        title: input.title,
        status: 'draft',
        ucansignTemplateId: input.templateId,
        quoteRequestId: input.quoteRequestId,
        acceptedQuoteId: input.acceptedQuoteId,
        clientCompanyId: input.clientCompanyId,
        factoryCompanyId: input.factoryCompanyId,
        expiryMinutes: input.expiryMinutes,
        participants: {
          create: input.participants.map((p) => ({
            role: p.role,
            name: p.name,
            email: p.email,
            phone: p.phone,
            signingOrder: p.signingOrder,
            signingMethodType: p.signingMethodType,
            authType: p.authType,
            status: 'need_signing',
          })),
        },
      },
      include: CONTRACT_INCLUDE,
    });

    this.logger.log(
      `Contract ${record.id} created as draft (participants=${record.participants.length})`,
    );
    return record;
  }

  async send(
    userId: string,
    id: string,
    input: SendContractInput = { resend: false },
  ): Promise<ContractRecord> {
    const record = await this.get(userId, id);

    if (record.status === 'completed' || record.status === 'cancelled') {
      throw new ConflictException(
        `Cannot send contract in terminal status '${record.status}'`,
      );
    }

    if (record.status === 'draft') {
      return this.dispatchDraft(record);
    }

    if (!input.resend) {
      throw new ConflictException(
        `Contract already sent (status='${record.status}'). Pass { resend: true } to nudge participants.`,
      );
    }

    if (!record.ucansignDocumentId) {
      throw new NotFoundException(
        'Vendor document not provisioned; cannot send reminder',
      );
    }
    await this.gateway.requestReminder(record.ucansignDocumentId);
    this.logger.log(
      `Contract ${record.id} reminder sent (documentId=${record.ucansignDocumentId}, status=${record.status})`,
    );
    return record;
  }

  private async dispatchDraft(record: ContractRecord): Promise<ContractRecord> {
    const defaultExpiryMinutes = Number(
      this.config.get<string>('UCANSIGN_DEFAULT_EXPIRY_MINUTES') ?? '20160',
    );
    const expiryMinutes = record.expiryMinutes ?? defaultExpiryMinutes;

    const document = await this.gateway.createDocument({
      templateId: record.ucansignTemplateId,
      documentName: record.title,
      isSequential: true,
      isSendMessage: true,
      expiryMinutes,
      participants: record.participants.map(
        (p): GatewayParticipant => ({
          name: p.name,
          email: p.email ?? undefined,
          phone: p.phone ?? undefined,
          signingOrder: p.signingOrder,
          signingMethodType:
            p.signingMethodType as GatewayParticipant['signingMethodType'],
          authType: (p.authType ?? undefined) as GatewayParticipant['authType'],
        }),
      ),
      customValues: {
        customValue: record.quoteRequestId ?? undefined,
        customValue1: record.acceptedQuoteId ?? undefined,
        customValue2: record.clientCompanyId ?? undefined,
        customValue3: record.factoryCompanyId ?? undefined,
        customValue5: record.id,
      },
    });

    let updateResult: { count: number };
    try {
      updateResult = await this.prisma.contract.updateMany({
        where: { id: record.id, status: 'draft' },
        data: {
          status: 'pending',
          ucansignDocumentId: document.documentId,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `DB persistence failed after vendor send for contract ${record.id}; attempting best-effort cancellation of vendor document ${document.documentId}`,
      );
      await this.safeCancelVendorDocument(document.documentId);
      throw error;
    }

    if (updateResult.count === 0) {
      this.logger.warn(
        `Concurrent send detected for contract ${record.id}; rolling back vendor document ${document.documentId}`,
      );
      await this.safeCancelVendorDocument(document.documentId);
      throw new ConflictException(
        `Contract ${record.id} already sent by another request`,
      );
    }

    const updated = await this.prisma.contract.findUnique({
      where: { id: record.id },
      include: CONTRACT_INCLUDE,
    });
    if (!updated) {
      throw new NotFoundException(
        `Contract ${record.id} disappeared after send`,
      );
    }
    this.logger.log(
      `Contract ${record.id} sent (documentId=${document.documentId})`,
    );
    return updated;
  }

  private async safeCancelVendorDocument(documentId: string): Promise<void> {
    try {
      await this.gateway.cancelDocument(
        documentId,
        'rollback after local persistence failure or send conflict',
      );
    } catch (cancelError) {
      this.logger.error(
        `Best-effort cancellation also failed for vendor document ${documentId}: ${(cancelError as Error).message}`,
      );
    }
  }

  async list(userId: string): Promise<ContractRecord[]> {
    return this.prisma.contract.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: CONTRACT_INCLUDE,
    });
  }

  async get(userId: string, id: string): Promise<ContractRecord> {
    const record = await this.prisma.contract.findUnique({
      where: { id },
      include: CONTRACT_INCLUDE,
    });
    if (!record) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    if (record.ownerUserId !== userId) {
      throw new ForbiddenException();
    }
    return record;
  }

  async cancel(
    userId: string,
    id: string,
    options: CancelContractOptions = {},
  ): Promise<ContractRecord> {
    const record = await this.get(userId, id);
    if (record.status === 'completed' || record.status === 'cancelled') {
      return record;
    }
    if (!record.ucansignDocumentId) {
      throw new NotFoundException(
        'Vendor document not yet provisioned for this contract',
      );
    }

    await this.gateway.cancelDocument(
      record.ucansignDocumentId,
      options.reason,
    );

    const now = new Date();
    const result = await this.prisma.contract.updateMany({
      where: {
        id,
        status: { notIn: ['completed', 'cancelled'] },
      },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        cancelledReason: options.reason ?? null,
      },
    });
    if (result.count === 0) {
      this.logger.warn(
        `Contract ${id} reached terminal state during cancel; vendor cancel may be redundant`,
      );
      return this.get(userId, id);
    }
    const updated = await this.prisma.contract.findUnique({
      where: { id },
      include: CONTRACT_INCLUDE,
    });
    if (!updated) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    this.logger.log(`Contract ${id} cancelled`);
    return updated;
  }

  async getPdfUrl(userId: string, id: string): Promise<{ url: string }> {
    const record = await this.get(userId, id);
    if (!record.ucansignDocumentId) {
      throw new NotFoundException(
        'Vendor document not yet provisioned for this contract',
      );
    }
    const file = await this.gateway.getDocumentFile(record.ucansignDocumentId);
    return { url: file.url };
  }

  async getAuditTrailUrl(
    userId: string,
    id: string,
  ): Promise<{ url: string; expiresAt?: string }> {
    const record = await this.get(userId, id);
    if (!record.ucansignDocumentId) {
      throw new NotFoundException(
        'Vendor document not yet provisioned for this contract',
      );
    }
    const file = await this.gateway.getAuditTrail(record.ucansignDocumentId);
    return { url: file.url, expiresAt: file.expiresAt };
  }

  async getSignEmbeddingUrl(
    userId: string,
    id: string,
    redirectUrl?: string,
  ): Promise<{ url: string; expiresAt?: string }> {
    const record = await this.get(userId, id);
    if (!record.ucansignDocumentId) {
      throw new NotFoundException(
        'Vendor document not yet provisioned for this contract',
      );
    }
    const file = await this.gateway.createSignEmbedding({
      documentId: record.ucansignDocumentId,
      redirectUrl,
    });
    return { url: file.url, expiresAt: file.expiresAt };
  }

  async getViewEmbeddingUrl(
    userId: string,
    id: string,
    redirectUrl?: string,
  ): Promise<{ url: string; expiresAt?: string }> {
    const record = await this.get(userId, id);
    if (!record.ucansignDocumentId) {
      throw new NotFoundException(
        'Vendor document not yet provisioned for this contract',
      );
    }
    const file = await this.gateway.createViewEmbedding({
      documentId: record.ucansignDocumentId,
      redirectUrl,
    });
    return { url: file.url, expiresAt: file.expiresAt };
  }

  async handleWebhookIdempotent(
    payload: UCanSignWebhookPayload,
    payloadHash: string,
  ): Promise<{ matched: boolean; contractId?: string }> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          source: 'ucansign',
          payloadHash,
          eventType: payload.eventType,
          documentId: payload.documentId,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const prior = await this.prisma.webhookEvent.findUnique({
          where: { payloadHash },
        });
        this.logger.log(
          `Idempotent webhook skip payloadHash=${payloadHash.slice(0, 12)} priorContractId=${prior?.contractId ?? 'n/a'}`,
        );
        return {
          matched: !!prior?.contractId,
          contractId: prior?.contractId ?? undefined,
        };
      }
      throw error;
    }

    const result = await this.handleWebhook(payload);

    if (result.matched && result.contractId) {
      await this.prisma.webhookEvent.update({
        where: { payloadHash },
        data: { contractId: result.contractId },
      });
    }

    return result;
  }

  async handleWebhook(
    payload: UCanSignWebhookPayload,
  ): Promise<{ matched: boolean; contractId?: string }> {
    const record = await this.findByWebhookPayload(payload);
    if (!record) {
      this.logger.warn(
        `Webhook for unknown documentId=${payload.documentId} customValue5=${payload.customValue5 ?? 'n/a'} (eventType=${payload.eventType})`,
      );
      return { matched: false };
    }

    const now = new Date();
    const updates = this.buildWebhookUpdate(payload, record, now);
    if (updates) {
      await this.prisma.contract.update({
        where: { id: record.id },
        data: updates,
      });
    }

    this.logger.log(
      `Webhook ${payload.eventType} applied to contract ${record.id}`,
    );
    return { matched: true, contractId: record.id };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private async findByWebhookPayload(
    payload: UCanSignWebhookPayload,
  ): Promise<ContractRecord | null> {
    if (payload.customValue5) {
      const byCustomValue = await this.prisma.contract.findUnique({
        where: { id: payload.customValue5 },
        include: CONTRACT_INCLUDE,
      });
      if (byCustomValue) return byCustomValue;
    }
    return this.prisma.contract.findUnique({
      where: { ucansignDocumentId: payload.documentId },
      include: CONTRACT_INCLUDE,
    });
  }

  private buildWebhookUpdate(
    payload: UCanSignWebhookPayload,
    record: ContractRecord,
    now: Date,
  ): Prisma.ContractUpdateInput | null {
    switch (payload.eventType) {
      case 'sign_creating':
        if (record.status !== 'draft') return null;
        return { status: 'pending' satisfies ContractStatus };

      case 'signing_canceled':
        if (record.status === 'completed') return null;
        if (record.status === 'cancelled') return null;
        return {
          status: 'cancelled' satisfies ContractStatus,
          cancelledAt: now,
          cancelledReason: payload.cancelReason ?? record.cancelledReason,
        };

      case 'signing_completed':
        if (record.status === 'cancelled') return null;
        if (record.status === 'completed') return null;
        return {
          status: 'in_progress' satisfies ContractStatus,
          participants: {
            updateMany: {
              where: {
                contractId: record.id,
                signingOrder: payload.participantSigningOrder,
              },
              data: {
                status: 'completed',
                signedAt: now,
                ucansignParticipantId: payload.participantId,
              },
            },
          },
        };

      case 'signing_completed_all':
        if (record.status === 'cancelled') return null;
        if (record.status === 'completed') return null;
        return {
          status: 'completed' satisfies ContractStatus,
          completedAt: now,
          participants: {
            updateMany: {
              where: {
                contractId: record.id,
                status: 'need_signing',
              },
              data: {
                status: 'completed',
                signedAt: now,
              },
            },
          },
        };
    }
  }
}
