import { Test } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

describe('AccountsController', () => {
  let controller: AccountsController;

  const serviceMock = {
    create: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const req = { user: { sub: 'u1' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountsService, useValue: serviceMock }],
    }).compile();
    controller = mod.get(AccountsController);
  });

  it('POST /accounts → create(req, dto)', async () => {
    serviceMock.create.mockResolvedValue({ id: 'a1', name: 'Caja' });
    const dto = { name: 'Caja', currencyCode: 'ARS' } as any;

    const res = await (controller as any).create(req, dto);

    expect(serviceMock.create).toHaveBeenCalledWith('u1', dto);
    expect(res).toEqual({ id: 'a1', name: 'Caja' });
  });

  it('GET /accounts → list(req)', async () => {
    serviceMock.list.mockResolvedValue([{ id: 'a1' }]);

    const res = await (controller as any).list(req);

    expect(serviceMock.list).toHaveBeenCalledWith('u1');
    expect(res).toEqual([{ id: 'a1' }]);
  });

  it('GET /accounts/:id → get(req, id)', async () => {
    serviceMock.get.mockResolvedValue({ id: 'a1' });

    const res = await (controller as any).get(req, 'a1');

    expect(serviceMock.get).toHaveBeenCalledWith('u1', 'a1');
    expect(res).toEqual({ id: 'a1' });
  });

  it('PATCH /accounts/:id → update(req, id, dto)', async () => {
    serviceMock.update.mockResolvedValue({ id: 'a1', name: 'Caja Principal' });
    const dto = { name: 'Caja Principal' } as any;

    const res = await (controller as any).update(req, 'a1', dto);

    expect(serviceMock.update).toHaveBeenCalledWith('u1', 'a1', dto);
    expect(res).toEqual({ id: 'a1', name: 'Caja Principal' });
  });

  it('DELETE /accounts/:id → remove(req, id)', async () => {
    serviceMock.remove.mockResolvedValue({ ok: true });

    const res = await (controller as any).remove(req, 'a1');

    expect(serviceMock.remove).toHaveBeenCalledWith('u1', 'a1');
    expect(res).toEqual({ ok: true });
  });
});
