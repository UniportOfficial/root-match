import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type {
  Contract,
  ContractParticipant,
  ContractStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateContractInput } from './dto/create-contract.dto';
import type { UCanSignWebhookPayload } from './dto/ucansign-webhook.schema';
import {
  CONTRACT_GATEWAY,
  type ContractGateway,
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
    const now = new Date();

    const defaultExpiryMinutes = Number(
      this.config.get<string>('UCANSIGN_DEFAULT_EXPIRY_MINUTES') ?? '20160',
    );

    const document = await this.gateway.createDocument({
      templateId: input.templateId,
      documentName: input.title,
      isSequential: true,
      isSendMessage: true,
      expiryMinutes: input.expiryMinutes ?? defaultExpiryMinutes,
      participants: input.participants.map((p) => ({
        name: p.name,
        email: p.email,
        phone: p.phone,
        signingOrder: p.signingOrder,
        signingMethodType: p.signingMethodType,
        authType: p.authType,
      })),
      customValues: {
        customValue: input.quoteRequestId,
        customValue1: input.acceptedQuoteId,
        customValue2: input.clientCompanyId,
        customValue3: input.factoryCompanyId,
        customValue5: contractId,
      },
    });

    const record = await this.prisma.contract.create({
      data: {
        id: contractId,
        ownerUserId: userId,
        title: input.title,
        status: 'pending',
        ucansignDocumentId: document.documentId,
        ucansignTemplateId: input.templateId,
        quoteRequestId: input.quoteRequestId,
        acceptedQuoteId: input.acceptedQuoteId,
        clientCompanyId: input.clientCompanyId,
        factoryCompanyId: input.factoryCompanyId,
        sentAt: now,
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
      `Contract ${record.id} created (documentId=${document.documentId}, participants=${record.participants.length})`,
    );
    return record;
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
    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        cancelledReason: options.reason ?? null,
      },
      include: CONTRACT_INCLUDE,
    });
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
        return {
          status: 'cancelled' satisfies ContractStatus,
          cancelledAt: now,
          cancelledReason: payload.cancelReason ?? record.cancelledReason,
        };

      case 'signing_completed':
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
