import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

const prismaMock = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as any;

const jwtMock = {
  signAsync: jest.fn(),
} as any;

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (v: string) => `hashed(${v})`),
  compare: jest.fn(
    async (raw: string, hashed: string) =>
      hashed === `hashed(${raw})` || hashed === 'refreshHashOk',
  ),
}));
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks(); // <-- en lugar de resetAllMocks
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);

    process.env.JWT_ACCESS_SECRET = 'acc';
    process.env.JWT_REFRESH_SECRET = 'ref';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';
  });

  it('register: crea usuario y devuelve tokens', async () => {
    prismaMock.user.create.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'stored',
    });
    const issueSpy = jest
      .spyOn(service as any, 'issueTokens')
      .mockResolvedValue({ access: 'A', refresh: 'R' });

    const res = await service.register({
      email: 'a@b.com',
      password: 'Secret123!',
      name: 'Juan',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Secret123!', expect.any(Number));
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'a@b.com', password: 'hashed(Secret123!)', name: 'Juan' },
    });
    expect(issueSpy).toHaveBeenCalledWith('u1', 'a@b.com');
    expect(res).toEqual({ access: 'A', refresh: 'R' });
  });

  it('login: valida credenciales y retorna tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hashed(Secret123!)',
    });
    const issueSpy = jest
      .spyOn(service as any, 'issueTokens')
      .mockResolvedValue({ access: 'A', refresh: 'R' });

    const res = await service.login({
      email: 'a@b.com',
      password: 'Secret123!',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@b.com' },
    });
    expect(issueSpy).toHaveBeenCalledWith('u1', 'a@b.com');
    expect(res).toEqual({ access: 'A', refresh: 'R' });
  });

  it('login: credenciales inválidas lanza Unauthorized', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hashed(otra)',
    });
    await expect(
      service.login({ email: 'a@b.com', password: 'Secret123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issueTokens: firma access/refresh y guarda hash del refresh (refreshTokenHash)', async () => {
    jwtMock.signAsync
      .mockResolvedValueOnce('ACC_TOKEN') // access
      .mockResolvedValueOnce('REF_TOKEN'); // refresh

    const res = await (service as any).issueTokens('u1', 'a@b.com');

    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: 'u1', email: 'a@b.com' },
      expect.objectContaining({ secret: 'acc' }),
    );
    expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
      2,
      { sub: 'u1', email: 'a@b.com' },
      expect.objectContaining({ secret: 'ref' }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { refreshTokenHash: 'hashed(REF_TOKEN)' },
    });
    expect(res).toEqual({ access: 'ACC_TOKEN', refresh: 'REF_TOKEN' });
  });

  it('rotateRefresh: refresh válido → devuelve nuevos tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      refreshTokenHash: 'refreshHashOk',
    });
    const issueSpy = jest
      .spyOn(service as any, 'issueTokens')
      .mockResolvedValue({ access: 'A2', refresh: 'R2' });

    const res = await service.rotateRefresh('u1', 'dummy');

    expect(issueSpy).toHaveBeenCalledWith('u1', 'a@b.com');
    expect(res).toEqual({ access: 'A2', refresh: 'R2' });
  });

  it('rotateRefresh: refresh inválido → Unauthorized', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      refreshTokenHash: 'other',
    });
    await expect(service.rotateRefresh('u1', 'fail')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logout: limpia refreshTokenHash', async () => {
    await service.logout('u1');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { refreshTokenHash: null },
    });
  });
});
