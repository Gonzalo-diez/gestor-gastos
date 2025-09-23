import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  budget: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

describe('BudgetsService', () => {
  let service: BudgetsService;
  const userId = 'u1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(BudgetsService);
  });

  it('list(userId, q): filtra por userId y opcionales categoryId/period', async () => {
    prismaMock.budget.findMany.mockResolvedValue([
      { id: 'b1', categoryId: 'c1', period: '2025-09', amount: 50000, category: { id: 'c1', name: 'Comida', type: 'EXPENSE' } },
    ]);

    const res = await service.list(userId, { categoryId: 'c1', period: '2025-09' });

    expect(prismaMock.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, categoryId: 'c1', period: '2025-09' },
        orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
      }),
    );
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ id: 'b1', categoryId: 'c1', period: '2025-09', amount: 50000 });
  });

  it('create(userId, dto): crea budget y devuelve selección', async () => {
    prismaMock.budget.create.mockResolvedValue({
      id: 'b1',
      categoryId: 'c1',
      period: '2025-09',
      amount: 50000,
      category: { id: 'c1', name: 'Comida', type: 'EXPENSE' },
    });

    const dto = { categoryId: 'c1', period: '2025-09', amount: 50000 } as const;
    const out = await service.create(userId, dto);

    expect(prismaMock.budget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId, ...dto },
      }),
    );
    expect(out).toMatchObject({ id: 'b1', categoryId: 'c1', period: '2025-09', amount: 50000 });
  });

  it('update(userId, id, dto): actualiza si existe y pertenece al usuario', async () => {
    prismaMock.budget.findFirst.mockResolvedValue({ id: 'b1', userId });
    prismaMock.budget.update.mockResolvedValue({
      id: 'b1',
      categoryId: 'c1',
      period: '2025-10',
      amount: 60000,
      category: { id: 'c1', name: 'Comida', type: 'EXPENSE' },
    });

    const dto = { period: '2025-10', amount: 60000 };
    const out = await service.update(userId, 'b1', dto);

    expect(prismaMock.budget.findFirst).toHaveBeenCalledWith({ where: { id: 'b1', userId } });
    expect(prismaMock.budget.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'b1' },
        data: dto,
      }),
    );
    expect(out).toMatchObject({ id: 'b1', period: '2025-10', amount: 60000 });
  });

  it('update: lanza NotFound si no pertenece o no existe', async () => {
    prismaMock.budget.findFirst.mockResolvedValue(null);
    await expect(service.update(userId, 'bX', { amount: 1 })).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.budget.update).not.toHaveBeenCalled();
  });

  it('remove(userId, id): borra si existe y pertenece', async () => {
    prismaMock.budget.findFirst.mockResolvedValue({ id: 'b1', userId });
    prismaMock.budget.delete.mockResolvedValue({ id: 'b1' });

    const out = await service.remove(userId, 'b1');

    expect(prismaMock.budget.findFirst).toHaveBeenCalledWith({ where: { id: 'b1', userId } });
    expect(prismaMock.budget.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    expect(out).toEqual({ ok: true });
  });

  it('remove: lanza NotFound si no pertenece o no existe', async () => {
    prismaMock.budget.findFirst.mockResolvedValue(undefined);

    await expect(service.remove(userId, 'bX')).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.budget.delete).not.toHaveBeenCalled();
  });
});
