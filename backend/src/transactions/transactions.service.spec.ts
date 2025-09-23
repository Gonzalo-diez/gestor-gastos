import { Test } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const prismaMock = {
  $transaction: jest.fn(async (ops: any[]) => Promise.all(ops)),
  account: { findUnique: jest.fn() },
  category: { findUnique: jest.fn() },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
} as any;

describe('TransactionsService', () => {
  let service: TransactionsService;
  const userId = 'u1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(TransactionsService);

    prismaMock.account.findUnique.mockResolvedValue({ userId });
    prismaMock.category.findUnique.mockResolvedValue({ userId });
  });

  it('create(userId, dto): crea transacción', async () => {
    const nowIso = new Date().toISOString();
    prismaMock.transaction.create.mockResolvedValue({ id: 't1' });

    const dto: any = {
      accountId: 'a1',
      categoryId: 'c1',
      type: 'INCOME',
      amount: '1000',      // tu service lo convierte a Decimal u otro tipo
      date: nowIso,
      description: 'Pago',
    };

    const res = await service.create(userId, dto);

    expect(prismaMock.account.findUnique).toHaveBeenCalledWith({ where: { id: 'a1' }, select: { userId: true } });
    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({ where: { id: 'c1' }, select: { userId: true } });

    const arg = prismaMock.transaction.create.mock.calls[0][0];
    expect(arg.data.userId).toBe('u1');
    expect(arg.data.accountId).toBe('a1');
    expect(arg.data.categoryId).toBe('c1');
    expect(arg.data.date).toBeInstanceOf(Date);
    // amount puede ser Decimal: compara como string
    expect(String(arg.data.amount)).toBe('1000');

    expect(res).toEqual({ id: 't1' });
  });

  it('list(userId, q): filtra y pagina', async () => {
    prismaMock.transaction.findMany.mockResolvedValue([{ id: 't1' }]);
    prismaMock.transaction.count.mockResolvedValue(1);
    prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });

    const q: any = { accountId: 'a1', categoryId: 'c1', type: 'EXPENSE', from: '2025-01-01', to: '2025-12-31', search: 'comida' };
    const res = await service.list(userId, q);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    if (Array.isArray(res)) expect(res[0]).toMatchObject({ id: 't1' });
    else {
      expect(res.items[0]).toMatchObject({ id: 't1' });
      expect(res.total).toBe(1);
    }
  });

  it('get(userId, id): retorna si pertenece', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue({ id: 't1', userId });
    const out = await service.get(userId, 't1');
    expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 't1' } }));
    expect(out).toMatchObject({ id: 't1' });
  });

  it('get: NotFound si no pertenece', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue({ id: 't1', userId: 'other' });
    await expect(service.get(userId, 't1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update(userId, id, dto): actualiza cantidad', async () => {
    const existingDate = new Date('2025-01-01T00:00:00Z');
    prismaMock.transaction.findUnique.mockResolvedValue({ id: 't1', userId, accountId: 'a1', date: existingDate, amount: 100 });
    prismaMock.transaction.update.mockResolvedValue({ id: 't1', amount: '120' });

    const dto = { amount: '120', date: new Date().toISOString() } as any;
    const out = await service.update(userId, 't1', dto);

    const arg = prismaMock.transaction.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: 't1' });
    expect(arg.data.date).toBeInstanceOf(Date);
    // amount puede ser Decimal: compara como string
    expect(String(arg.data.amount)).toBe('120');

    expect(out).toEqual({ id: 't1', amount: '120' });
  });

  it('update: NotFound si no pertenece', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue({ id: 't1', userId: 'other' });
    await expect(service.update(userId, 't1', { amount: '1' } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.transaction.update).not.toHaveBeenCalled();
  });

  it('remove(userId, id): elimina si pertenece', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue({ id: 't1', userId });
    prismaMock.transaction.delete.mockResolvedValue({ id: 't1' });

    const out = await service.remove(userId, 't1');

    expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    expect(out).toBeTruthy();
  });

  it('remove: NotFound si no existe/permiso', async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    await expect(service.remove(userId, 'tX')).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.transaction.delete).not.toHaveBeenCalled();
  });
});
