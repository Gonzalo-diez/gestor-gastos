import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as any;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(UsersService);
  });

  it('findAll: retorna la lista de usuarios', async () => {
    const rows = [{ id: 'u1', email: 'a@b.com' }];
    prismaMock.user.findMany.mockResolvedValue(rows);

    const res = await service.findAll();
    expect(prismaMock.user.findMany).toHaveBeenCalled();
    expect(res).toEqual(rows);
  });

  it('me: busca por id con select', async () => {
    const row = { id: 'u1', email: 'a@b.com', name: 'Juan', createdAt: new Date() };
    prismaMock.user.findUnique.mockResolvedValue(row);

    const res = await service.me('u1');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
    expect(res).toMatchObject({ id: 'u1', email: 'a@b.com' });
  });

  it('updateMe: actualiza con select', async () => {
    const updated = { id: 'u1', name: 'Juan', email: 'a@b.com', createdAt: new Date() };
    prismaMock.user.update.mockResolvedValue(updated);

    const res = await service.updateMe('u1', { name: 'Juan' } as any);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { name: 'Juan' },
      }),
    );
    expect(res).toMatchObject({ id: 'u1', name: 'Juan' });
  });

  it('deleteMe: elimina y devuelve ok:true', async () => {
    prismaMock.user.delete.mockResolvedValue({ id: 'u1' });

    const res = await service.deleteMe('u1');
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(res).toEqual({ ok: true });
  });
});
