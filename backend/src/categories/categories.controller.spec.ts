import { Test } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryType } from './dto/category-type.enum';

describe('CategoriesController', () => {
  let controller: CategoriesController;

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
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: serviceMock }],
    }).compile();
    controller = mod.get(CategoriesController);
  });

  it('GET /categories → list(req, q.type)', async () => {
    serviceMock.list.mockResolvedValue([{ id: 'c1' }]);

    const res = await (controller as any).list(req, { type: CategoryType.EXPENSE });

    expect(serviceMock.list).toHaveBeenCalledWith('u1', CategoryType.EXPENSE);
    expect(res).toEqual([{ id: 'c1' }]);
  });

  it('POST /categories → create(req, dto)', async () => {
    serviceMock.create.mockResolvedValue({ id: 'c1' });

    const res = await (controller as any).create(req, { name: 'Comida', type: CategoryType.EXPENSE });

    expect(serviceMock.create).toHaveBeenCalledWith('u1', { name: 'Comida', type: CategoryType.EXPENSE });
    expect(res).toEqual({ id: 'c1' });
  });

  it('PATCH /categories/:id → update(req, id, dto)', async () => {
    serviceMock.update.mockResolvedValue({ id: 'c1', name: 'Alimentos' });

    const res = await (controller as any).update(req, 'c1', { name: 'Alimentos' });

    expect(serviceMock.update).toHaveBeenCalledWith('u1', 'c1', { name: 'Alimentos' });
    expect(res).toEqual({ id: 'c1', name: 'Alimentos' });
  });

  it('DELETE /categories/:id → remove(req, id)', async () => {
    serviceMock.remove.mockResolvedValue({ ok: true });

    const res = await (controller as any).remove(req, 'c1');

    expect(serviceMock.remove).toHaveBeenCalledWith('u1', 'c1');
    expect(res).toEqual({ ok: true });
  });
});
