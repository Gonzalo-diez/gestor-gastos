import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Imports e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const email = `imp${Date.now()}@test.com`;
  const password = 'secret123';
  let access = '';
  let accountId = '';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.setGlobalPrefix('v1');
    await app.init();

    prisma = app.get(PrismaService);

    // Limpiar tablas principales
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Transaction","Budget","ImportRow","ImportBatch","Account","Category","User"
      RESTART IDENTITY CASCADE;
    `);

    // Moneda requerida por Accounts
    await prisma.currency.upsert({
      where: { code: 'ARS' },
      update: {},
      create: { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2 },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('register + login', async () => {
    await http()
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(201);
    const { body } = await http()
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);
    expect(body.access).toBeTruthy();
    access = body.access;
  });

  it('crear cuenta destino', async () => {
    const { body } = await http()
      .post('/v1/accounts')
      .set('Authorization', `Bearer ${access}`)
      .send({ name: 'Cuenta Import', currencyCode: 'ARS' })
      .expect(201);
    accountId = body.id;
  });

  it('preview → confirm CSV y crea transacciones', async () => {
    const csv =
      'date,amount,category,type,note\n' +
      '2025-09-01,1200,Comida,EXPENSE,Almuerzo\n' +
      '2025-09-02,200000,Salario,INCOME,Sueldo\n';

    // PREVIEW
    const prev = await http()
      .post('/v1/imports/preview')
      .set('Authorization', `Bearer ${access}`)
      .attach('file', Buffer.from(csv), 'tx.csv');
    expect([200, 201]).toContain(prev.status);
    const batchId = prev.body.batchId;
    expect(batchId).toBeTruthy();

    // Conteo antes
    const before = await prisma.transaction.count({ where: { accountId } });

    // CONFIRM
    const confirmBody = {
      batchId,
      accountId,
      columnMap: {
        date: 'date',
        amount: 'amount',
        note: 'note',
        categoryName: 'category',
        categoryType: 'type',
      },
      createMissingCategories: true,
      createBudgets: 'none',
    };
    const conf = await http()
      .post('/v1/imports/confirm')
      .set('Authorization', `Bearer ${access}`)
      .send(confirmBody);
    expect([200, 201]).toContain(conf.status);

    // Conteo después
    const after = await prisma.transaction.count({ where: { accountId } });
    expect(after - before).toBeGreaterThanOrEqual(2);

    // Categorías creadas
    const user = await prisma.user.findUnique({ where: { email } });
    const cats = await prisma.category.findMany({
      where: { userId: user!.id },
    });
    const names = cats.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Comida', 'Salario']));
  });
});
