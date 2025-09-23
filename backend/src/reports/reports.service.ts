import { Injectable } from '@nestjs/common';
import { Prisma, CategoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SummaryDto } from './dto/summary.dto';
import { CashflowDto } from './dto/cashflow.dto';
import { TopCategoriesDto } from './dto/top-categories.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /* === SUMMARY: totales por categoría (filtros opcionales) === */
  async summary(userId: string, q: SummaryDto) {
    const whereTx: Prisma.TransactionWhereInput = {
      userId,
      ...(q.accountId ? { accountId: q.accountId } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.from || q.to
        ? {
            date: {
              gte: q.from ? new Date(q.from) : undefined,
              lte: q.to ? new Date(q.to) : undefined,
            },
          }
        : {}),
    };

    // Si filtran por type, limitamos por categorías de ese tipo
    if (q.type) {
      const catIds = await this.prisma.category.findMany({
        where: { userId, type: q.type },
        select: { id: true },
      });
      whereTx.categoryId = { in: catIds.map((c) => c.id) };
    }

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: whereTx,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const cats = await this.prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
      select: { id: true, name: true, type: true },
    });
    const catMap = new Map(cats.map((c) => [c.id, c]));

    const items = grouped.map((g) => ({
      categoryId: g.categoryId,
      name: catMap.get(g.categoryId)?.name ?? 'Unknown',
      type: catMap.get(g.categoryId)?.type ?? null,
      amount: g._sum.amount?.toString() ?? '0',
    }));

    const totals = {
      income: items
        .filter((i) => i.type === CategoryType.INCOME)
        .reduce((a, b) => a + Number(b.amount), 0),
      expense: items
        .filter((i) => i.type === CategoryType.EXPENSE)
        .reduce((a, b) => a + Number(b.amount), 0),
    };

    return { items, totals, count: items.length };
  }

  /* === CASHFLOW: por periodo usando date_trunc (PostgreSQL) === */
  async cashflow(
    userId: string,
    q: CashflowDto,
  ) {
    const from = q.from ? new Date(q.from) : new Date('1970-01-01');
    const to   = q.to   ? new Date(q.to)   : new Date();
    const unit = q.groupBy === 'DAY' ? 'day' : q.groupBy === 'WEEK' ? 'week' : 'month';

    const rows = await this.prisma.$queryRaw<
      { period: Date; income: Prisma.Decimal; expense: Prisma.Decimal }[]
    >(Prisma.sql`
      SELECT
        date_trunc(${Prisma.raw(`'${unit}'`)}, t."date") AS period,
        SUM(CASE WHEN c."type"::text = 'INCOME'  THEN t."amount" ELSE 0 END) AS income,
        SUM(CASE WHEN c."type"::text = 'EXPENSE' THEN t."amount" ELSE 0 END) AS expense
      FROM "Transaction" t
      JOIN "Category" c ON c."id" = t."categoryId"
      WHERE
        t."userId" = ${userId}
        ${q.accountId ? Prisma.sql` AND t."accountId" = ${q.accountId}` : Prisma.empty}
        AND t."date" >= ${from}
        AND t."date" <= ${to}
      GROUP BY period
      ORDER BY period ASC
    `);

    let series = rows.map(r => ({
      period: r.period.toISOString(),
      income: Number(r.income),
      expense: Number(r.expense),
      net: Number(r.income) - Number(r.expense),
    }));
    if (q.fillEmpty) series = this.fillMissing(series, from, to, (q.groupBy ?? 'MONTH') as any);
    return { groupBy: q.groupBy ?? 'MONTH', series };
  }

  /* === TOP CATEGORIES: top N por tipo === */
  async topCategories(
    userId: string,
    q: { from?: string; to?: string; accountId?: string; type: 'INCOME'|'EXPENSE'; limit?: number },
  ) {
    const from = q.from ? new Date(q.from) : new Date('1970-01-01');
    const to   = q.to   ? new Date(q.to)   : new Date();
    const limit = Math.max(1, Math.min(50, q.limit ?? 5));

    const rows = await this.prisma.$queryRaw<
      { categoryId: string; name: string; amount: Prisma.Decimal }[]
    >(Prisma.sql`
      SELECT c."id" AS "categoryId", c."name", SUM(t."amount") AS amount
      FROM "Transaction" t
      JOIN "Category" c ON c."id" = t."categoryId"
      WHERE
        t."userId" = ${userId}
        AND c."type"::text = ${q.type}
        AND t."date" >= ${from}
        AND t."date" <= ${to}
        ${q.accountId ? Prisma.sql` AND t."accountId" = ${q.accountId}` : Prisma.empty}
      GROUP BY c."id", c."name"
      ORDER BY amount DESC
      LIMIT ${limit}
    `);

    return rows.map(r => ({ categoryId: r.categoryId, name: r.name, amount: Number(r.amount) }));
  }

  /* helpers */
  private fillMissing(
    rows: Array<{
      period: string;
      income: number;
      expense: number;
      net: number;
    }>,
    from: Date,
    to: Date,
    bucket: 'DAY' | 'WEEK' | 'MONTH',
  ) {
    const stepMs =
      bucket === 'DAY'
        ? 24 * 3600e3
        : bucket === 'WEEK'
          ? 7 * 24 * 3600e3
          : 30 * 24 * 3600e3; // aproximación a mes

    const map = new Map(rows.map((r) => [r.period.slice(0, 10), r])); // clave por fecha ISO prefix
    const out: typeof rows = [];
    let t = new Date(from);

    while (t <= to) {
      const key =
        bucket === 'MONTH'
          ? new Date(
              Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1),
            ).toISOString()
          : bucket === 'WEEK'
            ? new Date(
                Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()),
              ).toISOString()
            : new Date(
                Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()),
              ).toISOString();

      const found =
        rows.find((r) => r.period.startsWith(key.slice(0, 10))) ||
        map.get(key.slice(0, 10));
      out.push(found ?? { period: key, income: 0, expense: 0, net: 0 });

      // avanza
      if (bucket === 'MONTH') {
        t = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 1));
      } else {
        t = new Date(t.getTime() + stepMs);
      }
    }
    // dedupe ordenado por period
    out.sort((a, b) => a.period.localeCompare(b.period));
    return out;
  }
}
