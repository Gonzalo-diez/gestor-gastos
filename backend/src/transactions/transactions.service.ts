import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

const dedupe = (userId: string, accountId: string, date: Date, amount: number, note?: string) =>
  createHash('sha256')
    .update([userId, accountId, date.toISOString(), amount.toString(), note || ''].join('|'))
    .digest('hex');

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, q: { from?: string; to?: string; accountId?: string; categoryId?: string; page?: number; pageSize?: number }) {
    const where: Prisma.TransactionWhereInput = { userId };
    if (q.from || q.to) where.date = { gte: q.from ? new Date(q.from) : undefined, lte: q.to ? new Date(q.to) : undefined };
    if (q.accountId) where.accountId = q.accountId;
    if (q.categoryId) where.categoryId = q.categoryId;

    const page = Math.max(1, Number(q.page || 1));
    const take = Math.min(200, Math.max(1, Number(q.pageSize || 20)));
    const skip = (page - 1) * take;

    const [items, total, agg] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
        select: {
          id: true, date: true, amount: true, note: true, receiptUrl: true,
          account: { select: { id: true, name: true, currency: true } },
          category: { select: { id: true, name: true, type: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: take,
      sum: agg._sum.amount?.toString() ?? '0',
    };
  }

  async get(userId: string, id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true, userId: true, date: true, amount: true, note: true, receiptUrl: true,
        account: { select: { id: true, name: true, currency: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });
    if (!tx || tx.userId !== userId) throw new NotFoundException();
    const { userId: _u, ...view } = tx;
    return view;
  }

  async create(userId: string, dto: { accountId: string; categoryId: string; amount: number; date: string; note?: string; receiptUrl?: string }) {
    await this.assertAccount(userId, dto.accountId);
    await this.assertCategory(userId, dto.categoryId);
    const when = new Date(dto.date);
    const hash = dedupe(userId, dto.accountId, when, dto.amount, dto.note);

    try {
      return await this.prisma.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          amount: new Prisma.Decimal(dto.amount),
          date: when,
          note: dto.note,
          receiptUrl: dto.receiptUrl,
          dedupeHash: hash,
        },
        select: { id: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Transacción duplicada');
      throw e;
    }
  }

  async update(userId: string, id: string, dto: { accountId?: string; categoryId?: string; amount?: number; date?: string; note?: string; receiptUrl?: string }) {
    const current = await this.prisma.transaction.findUnique({ where: { id }, select: { userId: true, accountId: true, categoryId: true, amount: true, date: true, note: true } });
    if (!current || current.userId !== userId) throw new NotFoundException();

    if (dto.accountId && dto.accountId !== current.accountId) await this.assertAccount(userId, dto.accountId);
    if (dto.categoryId && dto.categoryId !== current.categoryId) await this.assertCategory(userId, dto.categoryId);

    const nextDate = dto.date ? new Date(dto.date) : current.date;
    const nextAmount = dto.amount ?? Number(current.amount);
    const nextAccount = dto.accountId ?? current.accountId;
    const nextNote = dto.note ?? current.note ?? undefined;
    const newHash = dedupe(userId, nextAccount, nextDate, nextAmount, nextNote);

    try {
      return await this.prisma.transaction.update({
        where: { id },
        data: {
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          date: dto.date ? nextDate : undefined,
          amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
          note: dto.note,
          receiptUrl: dto.receiptUrl,
          dedupeHash: newHash,
        },
        select: { id: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Transacción duplicada');
      throw e;
    }
  }

  async remove(userId: string, id: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id }, select: { userId: true } });
    if (!tx || tx.userId !== userId) throw new NotFoundException();
    await this.prisma.transaction.delete({ where: { id } });
    return { ok: true };
  }

  private async assertAccount(userId: string, id: string) {
    const a = await this.prisma.account.findUnique({ where: { id }, select: { userId: true } });
    if (!a || a.userId !== userId) throw new BadRequestException('Cuenta inválida');
  }
  private async assertCategory(userId: string, id: string) {
    const c = await this.prisma.category.findUnique({ where: { id }, select: { userId: true } });
    if (!c || c.userId !== userId) throw new BadRequestException('Categoría inválida');
  }
}