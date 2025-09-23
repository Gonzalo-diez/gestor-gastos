import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const serviceMock = {
    register: jest.fn(),
    login: jest.fn(),
    rotateRefresh: jest.fn(),
    logout: jest.fn(),
  };

  // helper mínimo para Response
  const resMock = () => {
    const cookies: any[] = [];
    return {
      cookie: jest.fn((...args) => cookies.push(args)),
      clearCookie: jest.fn(),
      _cookies: cookies,
    } as any;
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('register delega en service y devuelve tokens', async () => {
    serviceMock.register.mockResolvedValue({ access: 'A', refresh: 'R' });
    const out = await controller.register({ email: 'a@b.com', password: 'Secret123!', name: 'Juan' } as any);
    expect(serviceMock.register).toHaveBeenCalled();
    expect(out).toEqual({ access: 'A', refresh: 'R' });
  });

  it('login setea cookie refresh_token y responde access', async () => {
    serviceMock.login.mockResolvedValue({ access: 'A', refresh: 'R' });
    const res = resMock();
    const out = await (controller as any).login({ email: 'a@b.com', password: 'Secret123!' }, res);
    expect(serviceMock.login).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    const [name, val] = (res as any)._cookies[0];
    expect(name).toBe('refresh_token');
    expect(typeof val).toBe('string');
    expect(out).toEqual({ access: 'A' });
  });

  it('refresh renueva cookie y devuelve nuevo access', async () => {
    serviceMock.rotateRefresh.mockResolvedValue({ access: 'A2', refresh: 'R2' });
    const res = resMock();
    const req = { user: { sub: 'u1', refreshToken: 'tok' } };
    const out = await (controller as any).refresh(req, res);
    expect(serviceMock.rotateRefresh).toHaveBeenCalledWith('u1', 'tok');
    const [name, val] = (res as any)._cookies[0];
    expect(name).toBe('refresh_token');
    expect(val).toBe('R2');
    expect(out).toEqual({ access: 'A2' });
  });

  it('logout limpia cookie y devuelve ok', async () => {
    const res = resMock();
    const out = await controller.logout({ user: { sub: 'u1' } } as any, res);
    expect(serviceMock.logout).toHaveBeenCalledWith('u1');
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
    expect(out).toEqual({ ok: true });
  });

  it('me devuelve el payload del usuario', () => {
    const me = controller.me({ user: { sub: 'u1', email: 'a@b.com' } } as any);
    expect(me).toEqual({ sub: 'u1', email: 'a@b.com' });
  });
});
