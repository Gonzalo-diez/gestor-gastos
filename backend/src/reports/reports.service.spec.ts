import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  transaction: { groupBy: jest.fn() },
  category: { findMany: jest.fn() },
  $queryRaw: jest.fn(),
} as any;

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(ReportsService);
  });

  it('summary: agrupa por categoría y calcula totals', async () => {
    prismaMock.transaction.groupBy.mockResolvedValue([
      { categoryId: 'c1', _sum: { amount: 100 } },
      { categoryId: 'c2', _sum: { amount: 200 } },
    ]);
    prismaMock.category.findMany.mockResolvedValue([
      { id: 'c1', name: 'Salario', type: 'INCOME' },
      { id: 'c2', name: 'Comida', type: 'EXPENSE' },
    ]);

    const out = await service.summary('u1', { from: '2025-01-01', to: '2025-12-31' } as any);

    expect(prismaMock.transaction.groupBy).toHaveBeenCalled();
    expect(prismaMock.category.findMany).toHaveBeenCalled();
    expect(out.count).toBe(2);
    expect(out.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: 'c1', name: 'Salario', type: 'INCOME', amount: '100' }),
        expect.objectContaining({ categoryId: 'c2', name: 'Comida',  type: 'EXPENSE', amount: '200' }),
      ]),
    );
    expect(out.totals).toEqual({ income: 100, expense: 200 });
  });

  it('cashflow: devuelve series por periodo sin fillEmpty', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      { period: new Date('2025-01-01T00:00:00Z'), income: 3000, expense: 1000 },
      { period: new Date('2025-02-01T00:00:00Z'), income: 2000, expense: 1500 },
    ]);

    const out = await service.cashflow('u1', { from: '2025-01-01', to: '2025-03-01', groupBy: 'MONTH' } as any);

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(out.groupBy).toBe('MONTH');
    expect(out.series).toHaveLength(2);
    expect(out.series[0]).toMatchObject({ income: 3000, expense: 1000, net: 2000 });
  });

  it('topCategories: mapea filas a números y respeta limit', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      { categoryId: 'c2', name: 'Comida', amount: 8000 },
      { categoryId: 'c3', name: 'Transporte', amount: 2000 },
    ]);

    const out = await service.topCategories('u1', { type: 'EXPENSE', from: '2025-01-01', to: '2025-12-31', limit: 2 } as any);

    expect(prismaMock.$queryRaw).toHaveBeenCalled();
    expect(out).toEqual([
      { categoryId: 'c2', name: 'Comida', amount: 8000 },
      { categoryId: 'c3', name: 'Transporte', amount: 2000 },
    ]);
  });
});
