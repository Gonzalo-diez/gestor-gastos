import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const serviceMock = {
    findAll: jest.fn(),
    me: jest.fn(),
    updateMe: jest.fn(),
    deleteMe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: serviceMock }],
    }).compile();
    controller = mod.get(UsersController);
  });

  it('GET /users → findAll', async () => {
    serviceMock.findAll.mockResolvedValue([{ id: 'u1' }]);
    const res = await controller.findAll();
    expect(serviceMock.findAll).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'u1' }]);
  });

  it('GET /users/me → usa service.me con req.user.sub', async () => {
    serviceMock.me.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    const req = { user: { sub: 'u1' } } as any;
    const res = await (controller as any).me(req);
    expect(serviceMock.me).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ id: 'u1', email: 'a@b.com' });
  });

  it('PATCH /users/me → usa service.updateMe', async () => {
    serviceMock.updateMe.mockResolvedValue({ id: 'u1', name: 'Juan' });
    const req = { user: { sub: 'u1' } } as any;
    const res = await (controller as any).update(req, { name: 'Juan' } as any);
    expect(serviceMock.updateMe).toHaveBeenCalledWith('u1', { name: 'Juan' });
    expect(res).toEqual({ id: 'u1', name: 'Juan' });
  });

  it('DELETE /users/me → usa service.deleteMe', async () => {
    serviceMock.deleteMe.mockResolvedValue({ ok: true });
    const req = { user: { sub: 'u1' } } as any;
    const res = await (controller as any).remove(req);
    expect(serviceMock.deleteMe).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ ok: true });
  });
});
