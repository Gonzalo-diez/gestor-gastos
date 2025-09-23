import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryType } from './dto/category-type.enum';

const prismaMock = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  transaction: {
    count: jest.fn(),
  },
} as any;

describe('CategoriesService', () => {
  let service: CategoriesService;
  const userId = 'u1';

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(CategoriesService);
  });

  it('list(userId, type) filtra por usuario y tipo', async () => {
    prismaMock.category.findMany.mockResolvedValue([
      { id: 'c1', name: 'Comida', type: 'EXPENSE' },
    ]);

    const res = await service.list(userId, CategoryType.EXPENSE);

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, type: CategoryType.EXPENSE },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true },
      }),
    );
    expect(res).toHaveLength(1);
  });

  it('create(userId, dto) crea categoría y devuelve selección', async () => {
    prismaMock.category.create.mockResolvedValue({ id: 'c1', name: 'Comida', type: 'EXPENSE' });

    const out = await service.create(userId, { name: 'Comida', type: CategoryType.EXPENSE } as any);

    expect(prismaMock.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId, name: 'Comida', type: CategoryType.EXPENSE },
        select: { id: true, name: true, type: true },
      }),
    );
    expect(out).toMatchObject({ id: 'c1', name: 'Comida', type: 'EXPENSE' });
  });

  it('create: P2002 → ConflictException', async () => {
    prismaMock.category.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create(userId, { name: 'Comida', type: CategoryType.EXPENSE } as any))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('update(userId, id, dto) verifica owner y actualiza', async () => {
    prismaMock.category.findUnique.mockResolvedValue({ userId });
    prismaMock.category.update.mockResolvedValue({ id: 'c1', name: 'Alimentos', type: 'EXPENSE' });

    const out = await service.update(userId, 'c1', { name: 'Alimentos' } as any);

    expect(prismaMock.category.findUnique).toHaveBeenCalledWith({ where: { id: 'c1' }, select: { userId: true } });
    expect(prismaMock.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: { name: 'Alimentos' },
        select: { id: true, name: true, type: true },
      }),
    );
    expect(out).toMatchObject({ id: 'c1', name: 'Alimentos' });
  });

  it('update: P2002 → ConflictException', async () => {
    prismaMock.category.findUnique.mockResolvedValue({ userId });
    prismaMock.category.update.mockRejectedValue({ code: 'P2002' });
    await expect(service.update(userId, 'c1', { name: 'X' } as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('update: owner inválido → NotFound', async () => {
    prismaMock.category.findUnique.mockResolvedValue({ userId: 'other' });
    await expect(service.update(userId, 'c1', { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove(userId, id) sin transacciones elimina y retorna ok:true', async () => {
    prismaMock.category.findUnique.mockResolvedValue({ userId });
    prismaMock.transaction.count.mockResolvedValue(0);
    prismaMock.category.delete.mockResolvedValue({ id: 'c1' });

    const out = await service.remove(userId, 'c1');

    expect(prismaMock.transaction.count).toHaveBeenCalledWith({ where: { categoryId: 'c1' } });
    expect(prismaMock.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(out).toEqual({ ok: true });
  });

  it('remove: con transacciones → BadRequest', async () => {
    prismaMock.category.findUnique.mockResolvedValue({ userId });
    prismaMock.transaction.count.mockResolvedValue(2);

    await expect(service.remove(userId, 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove: owner inválido → NotFound', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);
    await expect(service.remove(userId, 'c1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
