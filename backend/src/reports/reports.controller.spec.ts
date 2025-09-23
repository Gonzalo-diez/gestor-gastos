import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;

  const serviceMock = {
    summary: jest.fn(),
    cashflow: jest.fn(),
    topCategories: jest.fn(),
  };

  const req = { user: { sub: 'u1' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: serviceMock }],
    }).compile();
    controller = mod.get(ReportsController);
  });

  it('GET /reports/summary → delega a service.summary(userId, q)', async () => {
    serviceMock.summary.mockResolvedValue({ items: [], totals: { income: 0, expense: 0 }, count: 0 });

    const q = { from: '2025-01-01', to: '2025-12-31' } as any;
    const res = await (controller as any).summary(req, q);

    expect(serviceMock.summary).toHaveBeenCalledWith('u1', q);
    expect(res).toEqual({ items: [], totals: { income: 0, expense: 0 }, count: 0 });
  });

  it('GET /reports/cashflow → delega a service.cashflow(userId, q)', async () => {
    serviceMock.cashflow.mockResolvedValue({ groupBy: 'MONTH', series: [] });

    const q = { from: '2025-01-01', to: '2025-12-31', groupBy: 'MONTH' } as any;
    const res = await (controller as any).cashflow(req, q);

    expect(serviceMock.cashflow).toHaveBeenCalledWith('u1', q);
    expect(res).toEqual({ groupBy: 'MONTH', series: [] });
  });

  it('GET /reports/top-categories → delega a service.topCategories(userId, q)', async () => {
    serviceMock.topCategories.mockResolvedValue([{ categoryId: 'c1', name: 'X', amount: 10 }]);

    const q = { type: 'EXPENSE', from: '2025-01-01', to: '2025-12-31', limit: 5 } as any;
    const res = await (controller as any).top(req, q);

    expect(serviceMock.topCategories).toHaveBeenCalledWith('u1', q);
    expect(res).toEqual([{ categoryId: 'c1', name: 'X', amount: 10 }]);
  });
});
