import { PrismaClient } from '@prisma/client';
import cc from 'currency-codes';

const prisma = new PrismaClient();

async function main() {
  const data = cc.codes().map(code => {
    const c = cc.code(code)!;
    return {
      code: c.code,
      name: c.currency,
      symbol: undefined,
      decimals: c.digits ?? 2,
    };
  });

  await prisma.currency.createMany({ data, skipDuplicates: true });

  // Backfill: asigna ARS (o la que uses por defecto) a cuentas sin moneda
  await prisma.$executeRawUnsafe(`UPDATE "Account" SET "currencyCode" = 'ARS' WHERE "currencyCode" IS NULL`);
}

main().finally(() => prisma.$disconnect());
