import { Test } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  const serviceMock = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const req = { user: { sub: 'u1' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: serviceMock }],
    }).compile();
    controller = mod.get(TransactionsController);
  });

  it('GET /transactions → list(req, q)', async () => {
    serviceMock.list.mockResolvedValue([{ id: 't1' }]);
    const q = { accountId: 'a1' } as any;

    const res = await (controller as any).list(req, q);

    expect(serviceMock.list).toHaveBeenCalledWith('u1', q);
    expect(Array.isArray(res) ? res[0] : res.items[0]).toMatchObject({ id: 't1' });
  });

  it('GET /transactions/:id → get(req, id)', async () => {
    serviceMock.get.mockResolvedValue({ id: 't1' });

    const res = await (controller as any).get(req, 't1');

    expect(serviceMock.get).toHaveBeenCalledWith('u1', 't1');
    expect(res).toEqual({ id: 't1' });
  });

  it('POST /transactions → create(req, dto)', async () => {
    serviceMock.create.mockResolvedValue({ id: 't1' });
    const dto = { accountId: 'a1', categoryId: 'c1', type: 'EXPENSE', amount: 50, date: new Date().toISOString() };

    const res = await (controller as any).create(req, dto);

    expect(serviceMock.create).toHaveBeenCalledWith('u1', dto);
    expect(res).toEqual({ id: 't1' });
  });

  it('PATCH /transactions/:id → update(req, id, dto)', async () => {
    serviceMock.update.mockResolvedValue({ id: 't1', amount: 99 });

    const res = await (controller as any).update(req, 't1', { amount: 99 });

    expect(serviceMock.update).toHaveBeenCalledWith('u1', 't1', { amount: 99 });
    expect(res).toEqual({ id: 't1', amount: 99 });
  });

  it('DELETE /transactions/:id → remove(req, id)', async () => {
    serviceMock.remove.mockResolvedValue({ ok: true });

    const res = await (controller as any).remove(req, 't1');

    expect(serviceMock.remove).toHaveBeenCalledWith('u1', 't1');
    expect(res).toEqual({ ok: true });
  });
});
