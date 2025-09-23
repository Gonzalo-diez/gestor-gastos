import { Test } from '@nestjs/testing';
import { ImportsService } from './imports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ImportsService', () => {
  let service: ImportsService;

  const prismaMock = {
    importBatch: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    importRow:   { findMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
    category:    { findMany: jest.fn(), createMany: jest.fn() },
    transaction: { createMany: jest.fn() },
    budget:      { upsert: jest.fn(), createMany: jest.fn() },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(ImportsService);

    // defaults
    prismaMock.importBatch.findUnique.mockResolvedValue({ id: 'up1', userId: 'u1', accountId: 'a1' });
    prismaMock.importBatch.update.mockResolvedValue({ id: 'up1' });
    prismaMock.importRow.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.transaction.createMany.mockResolvedValue({ count: 0 });
    prismaMock.category.findMany.mockResolvedValue([]);
    prismaMock.category.createMany.mockResolvedValue({ count: 0 });
  });

  it('confirm crea ≥2 transacciones y categorías usando alias categoryName/categoryType', async () => {
    prismaMock.importRow.findMany.mockResolvedValue([
      { id: 'r1', raw: { fecha: '2025-08-01', monto: '1000,50', nota: 'almuerzo', categoria: 'Comida', tipo: 'EXPENSE' } },
      { id: 'r2', raw: { fecha: '2025-08-05', monto: '200000',   nota: 'sueldo',   categoria: 'Salario', tipo: 'INCOME' } },
    ]);
    // 1ª: no existen; 2ª: luego de createMany sí existen
    prismaMock.category.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'cat:comida', name: 'Comida', type: 'EXPENSE' },
        { id: 'cat:salario', name: 'Salario', type: 'INCOME' },
      ]);
    prismaMock.category.createMany.mockResolvedValue({ count: 2 });
    prismaMock.transaction.createMany.mockResolvedValue({ count: 2 });

    const dto: any = {
      batchId: 'up1',
      accountId: 'a1',
      createMissingCategories: true,
      createBudgets: 'none',
      columnMap: {
        date: 'fecha',
        amount: 'monto',
        note: 'nota',
        categoryName: 'categoria',
        categoryType: 'tipo',
      },
    };

    const res = await service.confirm('u1', dto);

    expect(prismaMock.importBatch.findUnique).toHaveBeenCalledWith({ where: { id: 'up1' } });
    expect(prismaMock.category.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: 'u1', name: 'Comida', type: 'EXPENSE' }),
        expect.objectContaining({ userId: 'u1', name: 'Salario', type: 'INCOME' }),
      ]),
      skipDuplicates: true,
    });
    expect(prismaMock.transaction.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Array), skipDuplicates: true }),
    );
    expect(res.created).toBeGreaterThanOrEqual(2);
    expect(res.batchId).toBe('up1');
  });

  it('confirm con filas inválidas → created=0 y marca ERROR', async () => {
    prismaMock.importRow.findMany.mockResolvedValue([
      { id: 'bad', raw: { fecha: 'inválida', monto: 'NaN', tipo: 'X' } },
    ]);

    const res = await service.confirm('u1', {
      batchId: 'up1',
      accountId: 'a1',
      createMissingCategories: true,
      createBudgets: 'none',
      columnMap: { date: 'fecha', amount: 'monto', categoryType: 'tipo' },
    } as any);

    expect(res.created).toBe(0);
    expect(prismaMock.importRow.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: expect.any(Object) }),
        data: expect.objectContaining({ status: 'ERROR' }),
      }),
    );
  });
});
