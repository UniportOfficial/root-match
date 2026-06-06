import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Contract, ContractParticipant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContractsService, type ContractRecord } from './contracts.service';
import {
  CONTRACT_GATEWAY,
  type ContractGateway,
} from './gateway/contract-gateway.interface';

const NOW = new Date('2026-01-01T00:00:00Z');

function makeParticipant(
  order: number,
  overrides: Partial<ContractParticipant> = {},
): ContractParticipant {
  return {
    id: `part-${order}`,
    contractId: 'ctr-test',
    role: order === 1 ? 'client' : 'factory',
    name: `참여자 ${order}`,
    email: `p${order}@example.kr`,
    phone: null,
    signingOrder: order,
    signingMethodType: 'email',
    authType: null,
    ucansignParticipantId: null,
    status: 'need_signing',
    signedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeContractRecord(
  overrides: Partial<Contract> & { participants?: ContractParticipant[] } = {},
): ContractRecord {
  const { participants = [makeParticipant(1), makeParticipant(2)], ...rest } =
    overrides;
  return {
    id: 'ctr-test',
    ownerUserId: 'user-test',
    title: 'Test Contract',
    status: 'draft',
    ucansignDocumentId: null,
    ucansignTemplateId: 'tmpl-test',
    ucansignFolderId: null,
    quoteRequestId: null,
    acceptedQuoteId: null,
    clientCompanyId: null,
    factoryCompanyId: null,
    expiryMinutes: null,
    sentAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: NOW,
    updatedAt: NOW,
    participants,
    ...rest,
  };
}

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: jest.Mocked<PrismaService>;
  let gateway: jest.Mocked<ContractGateway>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockPrisma = {
      contract: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      webhookEvent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockGateway: jest.Mocked<ContractGateway> = {
      createDocument: jest.fn(),
      cancelDocument: jest.fn(),
      requestReminder: jest.fn(),
      getDocumentFile: jest.fn(),
      getAuditTrail: jest.fn(),
      createSignEmbedding: jest.fn(),
      createViewEmbedding: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('20160'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CONTRACT_GATEWAY, useValue: mockGateway },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(ContractsService);
    prisma = module.get(PrismaService);
    gateway = module.get(CONTRACT_GATEWAY);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create()', () => {
    it('persists expiryMinutes when provided in input', async () => {
      const record = makeContractRecord({ expiryMinutes: 60 });
      (prisma.contract.create as jest.Mock).mockResolvedValue(record);

      await service.create('user-test', {
        templateId: 'tmpl-test',
        title: 'Test Contract',
        participants: [
          {
            role: 'client',
            name: '참여자 1',
            email: 'p1@example.kr',
            signingOrder: 1,
            signingMethodType: 'email',
          },
          {
            role: 'factory',
            name: '참여자 2',
            email: 'p2@example.kr',
            signingOrder: 2,
            signingMethodType: 'email',
          },
        ],
        expiryMinutes: 60,
      });

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiryMinutes: 60 }),
        }),
      );
    });

    it('persists expiryMinutes as undefined (null in DB) when omitted from input', async () => {
      const record = makeContractRecord({ expiryMinutes: null });
      (prisma.contract.create as jest.Mock).mockResolvedValue(record);

      await service.create('user-test', {
        templateId: 'tmpl-test',
        title: 'Test Contract',
        participants: [
          {
            role: 'client',
            name: '참여자 1',
            email: 'p1@example.kr',
            signingOrder: 1,
            signingMethodType: 'email',
          },
          {
            role: 'factory',
            name: '참여자 2',
            email: 'p2@example.kr',
            signingOrder: 2,
            signingMethodType: 'email',
          },
        ],
      });

      const createCall = (prisma.contract.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.expiryMinutes).toBeUndefined();
    });

    it('persists clientCompanyId when provided', async () => {
      const record = makeContractRecord({ clientCompanyId: 'c-client-001' });
      (prisma.contract.create as jest.Mock).mockResolvedValue(record);

      await service.create('user-test', {
        templateId: 'tmpl-test',
        title: 'Test Contract',
        participants: [
          {
            role: 'client',
            name: '참여자 1',
            email: 'p1@example.kr',
            signingOrder: 1,
            signingMethodType: 'email',
          },
          {
            role: 'factory',
            name: '참여자 2',
            email: 'p2@example.kr',
            signingOrder: 2,
            signingMethodType: 'email',
          },
        ],
        clientCompanyId: 'c-client-001',
      });

      expect(prisma.contract.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientCompanyId: 'c-client-001' }),
        }),
      );
    });
  });

  describe('dispatchDraft (via send())', () => {
    function mockDraftRecord(
      overrides: Partial<Contract> & {
        participants?: ContractParticipant[];
      } = {},
    ): ContractRecord {
      return makeContractRecord({ status: 'draft', ...overrides });
    }

    function setupSendMocks(draftRecord: ContractRecord): void {
      (prisma.contract.findUnique as jest.Mock)
        .mockResolvedValueOnce(draftRecord)
        .mockResolvedValueOnce({
          ...draftRecord,
          status: 'pending',
          ucansignDocumentId: 'doc-mock',
          sentAt: NOW,
        });
      (gateway.createDocument as jest.Mock).mockResolvedValue({
        documentId: 'doc-mock',
      });
      (prisma.contract.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    }

    it('uses record.expiryMinutes when set on the contract', async () => {
      const draft = mockDraftRecord({ expiryMinutes: 300 });
      setupSendMocks(draft);

      await service.send('user-test', 'ctr-test');

      expect(gateway.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ expiryMinutes: 300 }),
      );
    });

    it('falls back to UCANSIGN_DEFAULT_EXPIRY_MINUTES env when record.expiryMinutes is null', async () => {
      configService.get.mockReturnValue('480');
      const draft = mockDraftRecord({ expiryMinutes: null });
      setupSendMocks(draft);

      await service.send('user-test', 'ctr-test');

      expect(gateway.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ expiryMinutes: 480 }),
      );
    });
  });
});
