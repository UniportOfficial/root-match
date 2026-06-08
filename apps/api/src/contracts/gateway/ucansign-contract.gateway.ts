import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UCanSignClient } from '../ucansign.client';
import type {
  ContractGateway,
  CreateEmbeddingInput,
  CreateGatewayDocumentInput,
  GatewayDocumentCreated,
  GatewayDocumentFile,
} from './contract-gateway.interface';

@Injectable()
export class UCanSignContractGateway implements ContractGateway {
  private readonly logger = new Logger(UCanSignContractGateway.name);

  constructor(
    private readonly client: UCanSignClient,
    private readonly config: ConfigService,
  ) {}

  async createDocument(
    input: CreateGatewayDocumentInput,
  ): Promise<GatewayDocumentCreated> {
    const forcedRecipient = this.resolveForcedRecipient();
    if (forcedRecipient) {
      this.logger.warn(
        `UCANSIGN_FORCE_RECIPIENT_EMAIL active — all signing recipients redirected to ${forcedRecipient}`,
      );
    }
    const result = await this.client.createDocumentFromTemplate({
      templateId: input.templateId,
      documentName: input.documentName,
      processType: 'PROCEDURE',
      isSequential: input.isSequential ?? true,
      isSendMessage: input.isSendMessage ?? true,
      configExpireMinute: input.expiryMinutes,
      participants: input.participants.map((p) => ({
        name: p.name,
        signingContactInfo: forcedRecipient ?? p.email ?? p.phone,
        signingOrder: p.signingOrder,
        signingMethodType: p.signingMethodType,
        authentications: p.authType ? [p.authType] : [],
      })),
      customValue: input.customValues.customValue,
      customValue1: input.customValues.customValue1,
      customValue2: input.customValues.customValue2,
      customValue3: input.customValues.customValue3,
      customValue4: input.customValues.customValue4,
      customValue5: input.customValues.customValue5,
    });
    return { documentId: result.documentId };
  }

  async cancelDocument(documentId: string, reason?: string): Promise<void> {
    await this.client.cancelDocument(documentId, reason);
  }

  async requestReminder(documentId: string): Promise<void> {
    await this.client.requestReminder(documentId);
  }

  async getDocumentFile(documentId: string): Promise<GatewayDocumentFile> {
    const file = await this.client.getDocumentFile(documentId);
    return { url: file.url, expiresAt: file.expiresAt };
  }

  async getAuditTrail(documentId: string): Promise<GatewayDocumentFile> {
    const file = await this.client.getAuditTrail(documentId);
    return { url: file.url, expiresAt: file.expiresAt };
  }

  async createSignEmbedding(
    input: CreateEmbeddingInput,
  ): Promise<GatewayDocumentFile> {
    const file = await this.client.createSignEmbedding(
      input.documentId,
      input.redirectUrl,
    );
    return { url: file.url, expiresAt: file.expiresAt };
  }

  async createViewEmbedding(
    input: CreateEmbeddingInput,
  ): Promise<GatewayDocumentFile> {
    const file = await this.client.createViewEmbedding(
      input.documentId,
      input.redirectUrl,
    );
    return { url: file.url, expiresAt: file.expiresAt };
  }

  private resolveForcedRecipient(): string | null {
    const raw = this.config.get<string>('UCANSIGN_FORCE_RECIPIENT_EMAIL');
    const trimmed = raw?.trim();
    return trimmed ? trimmed : null;
  }
}
