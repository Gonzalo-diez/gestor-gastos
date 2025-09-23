import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryType } from './dto/category-type.enum';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  list(userId: string, type?: CategoryType) {
    return this.prisma.category.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    });
  }

  async get(userId: string, id: string) {
    const c = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, type: true, userId: true },
    });
    if (!c || c.userId !== userId) throw new NotFoundException();
    const { userId: _, ...view } = c;
    return view;
  }

  async create(userId: string, dto: { name: string; type: CategoryType }) {
    try {
      return await this.prisma.category.create({
        data: { userId, name: dto.name, type: dto.type },
        select: { id: true, name: true, type: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Categoría duplicada para ese tipo');
      throw e;
    }
  }

  async update(userId: string, id: string, dto: { name?: string; type?: CategoryType }) {
    await this.assertOwner(userId, id);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: dto,
        select: { id: true, name: true, type: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Categoría duplicada para ese tipo');
      throw e;
    }
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    const cnt = await this.prisma.transaction.count({ where: { categoryId: id } });
    if (cnt > 0) throw new BadRequestException('La categoría tiene transacciones asociadas');
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwner(userId: string, id: string) {
    const c = await this.prisma.category.findUnique({ where: { id }, select: { userId: true } });
    if (!c || c.userId !== userId) throw new NotFoundException();
  }
}