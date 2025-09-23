import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, CategoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRow, type ColumnMap } from './mappers/column-map';
import { ConfirmDto } from './dto/confirm.dto';
import { parseXlsx, XlsxParsedFile } from './parsers/xlsx.parser';
import { CsvParsedFile, parseCsv } from './parsers/csv.parser';

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}

  // igual a tu versión anterior; sin cambios funcionales
  async preview(
    userId: string,
    file: Express.Multer.File,
    dto: { worksheet?: string; delimiter?: string; sampleSize?: number },
  ) {
    const isCsv =
      file.mimetype.includes('csv') ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (isCsv) {
      const parsed: CsvParsedFile = parseCsv(file.buffer, dto.delimiter);
      const batch = await this.prisma.importBatch.create({
        data: {
          userId,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          status: 'PARSED',
          columnMap: {},
          delimiter: parsed.delimiter,
          parsedRows: parsed.rows.length,
        },
      });

      const MAX_ROWS = 5000;
      if (parsed.rows.length) {
        await this.prisma.importRow.createMany({
          data: parsed.rows.slice(0, MAX_ROWS).map((r) => ({ batchId: batch.id, raw: r })),
        });
      }

      const sampleSize = Math.min(dto.sampleSize ?? 20, 50);
      return {
        batchId: batch.id,
        columns: parsed.columns,
        detected: { delimiter: parsed.delimiter },
        sample: parsed.rows.slice(0, sampleSize),
        stored: Math.min(parsed.rows.length, MAX_ROWS),
        totalParsed: parsed.rows.length,
      };
    } else {
      const parsed: XlsxParsedFile = parseXlsx(file.buffer, dto.worksheet);
      const batch = await this.prisma.importBatch.create({
        data: {
          userId,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          status: 'PARSED',
          columnMap: {},
          worksheet: parsed.worksheet,
          parsedRows: parsed.rows.length,
        },
      });

      const MAX_ROWS = 5000;
      if (parsed.rows.length) {
        await this.prisma.importRow.createMany({
          data: parsed.rows.slice(0, MAX_ROWS).map((r) => ({ batchId: batch.id, raw: r })),
        });
      }

      const sampleSize = Math.min(dto.sampleSize ?? 20, 50);
      return {
        batchId: batch.id,
        columns: parsed.columns,
        detected: { worksheet: parsed.worksheet },
        sample: parsed.rows.slice(0, sampleSize),
        stored: Math.min(parsed.rows.length, MAX_ROWS),
        totalParsed: parsed.rows.length,
      };
    }
  }

  async confirm(
    userId: string,
    dto: {
      batchId: string;
      columnMap: any;
      accountId?: string;
      createMissingCategories?: boolean;
      rowsToImport?: string[];
      // presupuestos
      createBudgets?: 'none' | 'sum';
      budgetPeriodFromRow?: boolean;
      fixedPeriod?: string;            // 'YYYY-MM'
      overwriteBudgets?: boolean;
    },
  ) {
    const batch = await this.prisma.importBatch.findUnique({ where: { id: dto.batchId } });
    if (!batch || batch.userId !== userId) throw new BadRequestException('Batch inválido');

    const accountId = dto.accountId || batch.accountId;
    if (!accountId) throw new BadRequestException('accountId requerido');

    const rows = await this.prisma.importRow.findMany({
      where: { batchId: dto.batchId, ...(dto.rowsToImport?.length ? { id: { in: dto.rowsToImport } } : {}) },
    });
    if (!rows.length) throw new BadRequestException('Sin filas para importar');
    
    // traducir alias → claves canónicas para el mapper
    const cmIn: any = dto.columnMap || {};
    const colMap: ColumnMap = {
      date: cmIn.date,
      amount: cmIn.amount,
      note: cmIn.note,
      category: cmIn.category ?? cmIn.categoryName,   // alias
      type: cmIn.type ?? cmIn.categoryType,           // alias
    };

    // usar colMap, NO dto.columnMap directo
    const normalized = rows.map(r => ({
      id: r.id,
      n: mapRow(r.raw as any, colMap, {}, userId, accountId),
    }));

    // ---- Normalización crítica ----
    for (const { n } of normalized) {
      // type
      if (n.categoryType != null) {
        const t = String(n.categoryType).trim().toUpperCase();
        n.categoryType = (t === 'INCOME' || t === 'EXPENSE') ? (t as any) : undefined as any;
      }
      // amount
      if (n.amount != null && typeof n.amount !== 'number') {
        const a = Number(String(n.amount).replace(/\s/g, '').replace(/,/g, '.'));
        if (Number.isFinite(a)) (n as any).amount = a; else (n as any).error = 'Monto inválido';
      }
      // date
      if (n.date && !(n.date instanceof Date)) {
        const d = new Date(String(n.date));
        if (!isNaN(+d)) (n as any).date = d; else (n as any).error = 'Fecha inválida';
      }
      // cat name
      if (n.categoryName != null) (n as any).categoryName = String(n.categoryName).trim();
    }

    // ---- Resolver categorías ----
    const neededCats = new Map<string, { name: string; type: 'INCOME' | 'EXPENSE' }>();
    for (const { n } of normalized) {
      if (n.categoryName && n.categoryType) {
        neededCats.set(`${n.categoryName}::${n.categoryType}`, { name: n.categoryName, type: n.categoryType });
      }
    }

    const existing = await this.prisma.category.findMany({
      where: { userId, OR: Array.from(neededCats.values()).map(c => ({ name: c.name, type: c.type })) },
      select: { id: true, name: true, type: true },
    });
    const key = (name: string, type: string) => `${name}::${type}`;
    const catMap = new Map(existing.map(c => [key(c.name, c.type), c.id]));

    if (dto.createMissingCategories && neededCats.size) {
      const toCreate = Array.from(neededCats.values()).filter(c => !catMap.has(key(c.name, c.type)));
      if (toCreate.length) {
        await this.prisma.category.createMany({
          data: toCreate.map(c => ({ userId, name: c.name, type: c.type as any })),
          skipDuplicates: true,
        });
        const re = await this.prisma.category.findMany({
          where: { userId, OR: toCreate.map(c => ({ name: c.name, type: c.type as any })) },
          select: { id: true, name: true, type: true },
        });
        re.forEach(c => catMap.set(key(c.name, c.type), c.id));
      }
    }

    // ---- Preparar inserciones y agregados de presupuestos ----
    const toCreateTx: Prisma.TransactionCreateManyInput[] = [];
    const validIds: string[] = [];
    let errors = 0;

    const periodOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const wantBudgets = (dto.createBudgets ?? 'none') !== 'none';
    const budgetsAgg = new Map<string, { categoryId: string; period: string; amount: number }>(); // suma en número

    for (const { id, n } of normalized) {
      if (n.error || !n.date || n.amount === undefined) { errors++; continue; }

      let categoryId: string | undefined;
      if (n.categoryName && n.categoryType) {
        categoryId = catMap.get(key(n.categoryName, n.categoryType));
      }
      if (!categoryId) { errors++; continue; }

      toCreateTx.push({
        userId,
        accountId,
        categoryId,
        date: n.date,
        amount: new Prisma.Decimal(n.amount),
        note: n.note ?? undefined,
        dedupeHash: n.dedupeHash ?? undefined,
        importRowId: id,
      });
      validIds.push(id);

      if (wantBudgets && n.categoryType === 'EXPENSE') {
        const period =
          (dto.budgetPeriodFromRow ?? true)
            ? (typeof (n as any).period === 'string' ? (n as any).period : periodOf(n.date))
            : (dto.fixedPeriod ?? periodOf(n.date));

        const bkey = `${categoryId}::${period}`;
        const prev = budgetsAgg.get(bkey);
        const add = Math.abs(Number(n.amount || 0));
        if (!prev) budgetsAgg.set(bkey, { categoryId, period, amount: add });
        else budgetsAgg.set(bkey, { ...prev, amount: prev.amount + add });
      }
    }

    // ---- Insertar transacciones ----
    const resultTx = toCreateTx.length
      ? await this.prisma.transaction.createMany({ data: toCreateTx, skipDuplicates: true })
      : { count: 0 };

    // ---- Marcar filas ----
    if (validIds.length) {
      await this.prisma.importRow.updateMany({ where: { id: { in: validIds } }, data: { status: 'IMPORTED' } });
    }
    if (errors) {
      const errorIds = normalized
        .filter(r => r.n.error || !r.n.date || r.n.amount === undefined || !r.n.categoryName || !r.n.categoryType)
        .map(r => r.id);
      if (errorIds.length) {
        await this.prisma.importRow.updateMany({
          where: { id: { in: errorIds } },
          data: { status: 'ERROR', error: 'Fila inválida o sin categoría' },
        });
      }
    }

    // ---- Presupuestos (opcional) ----
    let budgetsAffected = 0;
    if (wantBudgets && budgetsAgg.size) {
      const items = Array.from(budgetsAgg.values());
      if (dto.overwriteBudgets) {
        for (const b of items) {
          await this.prisma.budget.upsert({
            where: { userId_categoryId_period: { userId, categoryId: b.categoryId, period: b.period } },
            create: { userId, categoryId: b.categoryId, period: b.period, amount: new Prisma.Decimal(b.amount) },
            update: { amount: new Prisma.Decimal(b.amount) },
          });
        }
        budgetsAffected = items.length;
      } else {
        await this.prisma.budget.createMany({
          data: items.map(b => ({
            userId,
            categoryId: b.categoryId,
            period: b.period,
            amount: new Prisma.Decimal(b.amount),
          })),
          skipDuplicates: true,
        });
        budgetsAffected = items.length;
      }
    }

    // ---- Actualizar batch ----
    await this.prisma.importBatch.update({
      where: { id: dto.batchId },
      data: {
        columnMap: dto.columnMap as any,
        validRows: validIds.length,
        errorRows: errors,
        appliedRows: resultTx.count,
        status: 'APPLIED',
        appliedAt: new Date(),
      },
    });

    return {
      batchId: dto.batchId,
      parsed: rows.length,
      valid: validIds.length,
      errors,
      created: resultTx.count,
      budgetsAffected,
      skipped: validIds.length - resultTx.count,
    };
  }
}