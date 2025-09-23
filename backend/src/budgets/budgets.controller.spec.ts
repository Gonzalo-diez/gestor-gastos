// src/budgets/budgets.controller.spec.ts
import { Test } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

describe('BudgetsController', () => {
  let controller: BudgetsController;

  const serviceMock = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const req = { user: { sub: 'u1' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [{ provide: BudgetsService, useValue: serviceMock }],
    }).compile();
    controller = mod.get(BudgetsController);
  });

  it('GET /budgets → list(req, q)', async () => {
    serviceMock.list.mockResolvedValue([{ id: 'b1' }]);
    const q = { categoryId: 'c1', period: '2025-09' };

    const res = await (controller as any).list(req, q);

    expect(serviceMock.list).toHaveBeenCalledWith('u1', q);
    expect(res).toEqual([{ id: 'b1' }]);
  });

  it('POST /budgets → create(req, dto)', async () => {
    serviceMock.create.mockResolvedValue({ id: 'b1' });
    const dto = { categoryId: 'c1', period: '2025-09', amount: 50000 };

    const res = await (controller as any).upsert(req, dto);

    expect(serviceMock.create).toHaveBeenCalledWith('u1', dto);
    expect(res).toEqual({ id: 'b1' });
  });

  it('PATCH /budgets/:id → update(req, id, dto)', async () => {
    serviceMock.update.mockResolvedValue({ id: 'b1', amount: 60000 });
    const dto = { amount: 60000 };

    const res = await (controller as any).update(req, 'b1', dto);

    expect(serviceMock.update).toHaveBeenCalledWith('u1', 'b1', dto);
    expect(res).toEqual({ id: 'b1', amount: 60000 });
  });

  it('DELETE /budgets/:id → remove(req, id)', async () => {
    serviceMock.remove.mockResolvedValue({ ok: true });

    const res = await (controller as any).remove(req, 'b1');

    expect(serviceMock.remove).toHaveBeenCalledWith('u1', 'b1');
    expect(res).toEqual({ ok: true });
  });
});
