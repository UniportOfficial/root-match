import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  ContractGateway,
  CreateEmbeddingInput,
  CreateGatewayDocumentInput,
  GatewayDocumentCreated,
  GatewayDocumentFile,
} from './contract-gateway.interface';

const MOCK_URL_TTL_MS = 3 * 60_000;
const MOCK_EMBEDDING_TTL_MS = 30 * 60_000;

/**
 * Network-free contract gateway used in dev/demo and when CONTRACT_GATEWAY=mock.
 *
 * Returns synthetic identifiers and signed-URL stubs with the same 3-minute
 * expiry semantics as the real vendor so callers exercise the same staleness
 * paths. No vendor calls, no point consumption.
 */
@Injectable()
export class MockContractGateway implements ContractGateway {
  private readonly logger = new Logger(MockContractGateway.name);

  async createDocument(
    input: CreateGatewayDocumentInput,
  ): Promise<GatewayDocumentCreated> {
    const documentId = `mock-doc-${randomUUID()}`;
    this.logger.log(
      `[mock] createDocument templateId=${input.templateId} participants=${input.participants.length} → ${documentId}`,
    );
    return Promise.resolve({ documentId });
  }

  async cancelDocument(documentId: string, reason?: string): Promise<void> {
    this.logger.log(
      `[mock] cancelDocument ${documentId} reason=${reason ?? 'n/a'}`,
    );
    return Promise.resolve();
  }

  async requestReminder(documentId: string): Promise<void> {
    this.logger.log(`[mock] requestReminder ${documentId}`);
    return Promise.resolve();
  }

  async getDocumentFile(documentId: string): Promise<GatewayDocumentFile> {
    return Promise.resolve({
      url: `https://mock.rootmatching.local/contracts/${documentId}.pdf`,
      expiresAt: new Date(Date.now() + MOCK_URL_TTL_MS).toISOString(),
    });
  }

  async getAuditTrail(documentId: string): Promise<GatewayDocumentFile> {
    return Promise.resolve({
      url: `https://mock.rootmatching.local/contracts/${documentId}-audit.pdf`,
      expiresAt: new Date(Date.now() + MOCK_URL_TTL_MS).toISOString(),
    });
  }

  async createSignEmbedding(
    input: CreateEmbeddingInput,
  ): Promise<GatewayDocumentFile> {
    this.logger.log(
      `[mock] createSignEmbedding ${input.documentId} redirectUrl=${input.redirectUrl ?? 'n/a'}`,
    );
    return Promise.resolve({
      url: `https://mock.rootmatching.local/contracts/${input.documentId}/embed/sign`,
      expiresAt: new Date(Date.now() + MOCK_EMBEDDING_TTL_MS).toISOString(),
    });
  }

  async createViewEmbedding(
    input: CreateEmbeddingInput,
  ): Promise<GatewayDocumentFile> {
    this.logger.log(
      `[mock] createViewEmbedding ${input.documentId} redirectUrl=${input.redirectUrl ?? 'n/a'}`,
    );
    return Promise.resolve({
      url: `https://mock.rootmatching.local/contracts/${input.documentId}/embed/view`,
      expiresAt: new Date(Date.now() + MOCK_EMBEDDING_TTL_MS).toISOString(),
    });
  }
}
