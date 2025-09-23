import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, q: { categoryId?: string; period?: string }) {
    return this.prisma.budget.findMany({
      where: {
        userId,
        ...(q.categoryId ? { categoryId: q.categoryId } : {}),
        ...(q.period ? { period: q.period } : {}),
      },
      orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        categoryId: true,
        period: true,
        amount: true,
        category: { select: { id: true, name: true, type: true } }, // 👈 nombre aquí
      },
    });
  }

  async create(
    userId: string,
    dto: { categoryId: string; period: string; amount: number },
  ) {
    return this.prisma.budget.create({
      data: { userId, ...dto },
      select: {
        id: true,
        categoryId: true,
        period: true,
        amount: true,
        category: { select: { id: true, name: true, type: true } }, // 👈
      },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: Partial<{ period: string; amount: number }>,
  ) {
    const exists = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException('Budget no encontrado');

    return this.prisma.budget.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        categoryId: true,
        period: true,
        amount: true,
        category: { select: { id: true, name: true, type: true } }, // 👈
      },
    });
  }

  async remove(userId: string, id: string) {
    const exists = await this.prisma.budget.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException('Budget no encontrado');
    await this.prisma.budget.delete({ where: { id } });
    return { ok: true };
  }
}
