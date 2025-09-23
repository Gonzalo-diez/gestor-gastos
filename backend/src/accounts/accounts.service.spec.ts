import { Test } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  currency: {
    findUnique: jest.fn(),
  },
  transaction: {
    count: jest.fn(),
  },
} as any;

describe('AccountsService', () => {
  let service: AccountsService;
  const userId = 'u1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(AccountsService);
  });

  it('create(userId, dto): crea cuenta', async () => {
    prismaMock.currency.findUnique.mockResolvedValue({ id: 'cur-ARS', code: 'ARS' });
    prismaMock.account.create.mockResolvedValue({
      id: 'a1',
      name: 'Caja',
      userId,
      currencyCode: 'ARS',
      createdAt: new Date(),
      currency: { code: 'ARS', name: 'Peso Argentino', symbol: '$', decimals: 2 },
    });

    const dto = { name: 'Caja', currencyCode: 'ARS' } as any;
    const res = await service.create(userId, dto);

    expect(prismaMock.currency.findUnique).toHaveBeenCalledWith({ where: { code: 'ARS' } });
    // el service usa currencyCode, no currencyId
    expect(prismaMock.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId, name: 'Caja', currencyCode: 'ARS' }),
      }),
    );
    expect(res).toMatchObject({ id: 'a1', name: 'Caja', currencyCode: 'ARS' });
  });

  it('findAll(userId): lista cuentas del usuario', async () => {
    prismaMock.account.findMany.mockResolvedValue([{ id: 'a1', userId }]);

    const res = await service.list(userId);

    expect(prismaMock.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId } }),
    );
    expect(res).toEqual([{ id: 'a1', userId }]);
  });

  it('findOne(userId, id): busca con owner check', async () => {
    prismaMock.account.findUnique.mockResolvedValue({
      id: 'a1', userId, name: 'Caja', createdAt: new Date(), currency: { code: 'ARS' },
    });

    const res = await service.get(userId, 'a1');

    expect(prismaMock.account.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' } }),
    );
    expect(res).toMatchObject({ id: 'a1', name: 'Caja' });
  });

  it('update(userId, id, dto): actualiza (owner ok)', async () => {
    // assertOwner
    prismaMock.account.findUnique.mockResolvedValue({ userId });
    prismaMock.account.update.mockResolvedValue({
      id: 'a1', name: 'Caja Principal', userId, createdAt: new Date(), currency: { code: 'ARS' },
    });

    const dto = { name: 'Caja Principal' } as any;
    const res = await service.update(userId, 'a1', dto);

    expect(prismaMock.account.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: dto }),
    );
    expect(res).toMatchObject({ id: 'a1', name: 'Caja Principal' });
  });

  it('remove(userId, id): elimina (owner ok)', async () => {
    // assertOwner
    prismaMock.account.findUnique.mockResolvedValue({ userId });
    prismaMock.transaction.count.mockResolvedValue(0);
    prismaMock.account.delete.mockResolvedValue({ id: 'a1' });

    const res = await service.remove(userId, 'a1');

    expect(prismaMock.transaction.count).toHaveBeenCalledWith({ where: { accountId: 'a1' } });
    expect(prismaMock.account.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
    expect(res).toEqual({ ok: true });
  });
});

