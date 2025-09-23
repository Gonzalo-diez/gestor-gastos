import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const email = `u${Date.now()}@test.com`;
  const password = 'secret123';
  let access = '';

  let accountId = '';
  let categoryId = '';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('v1'); // si en main.ts lo usas, mantenlo igual aquí
    await app.init();

    prisma = app.get(PrismaService);

    // Limpia DB mínima
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Transaction",
        "Budget",
        "ImportRow",
        "ImportBatch",
        "Account",
        "Category",
        "User"
      RESTART IDENTITY CASCADE;
    `);

    // Seed de monedas necesarias para las cuentas (si tu DTO exige currencyCode)
    await prisma.currency.upsert({
      where: { code: 'ARS' },
      update: {},
      create: { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2 },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('register', async () => {
    await http()
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(201);
  });

  it('login', async () => {
    const { body } = await http()
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(201);
    expect(body.access).toBeTruthy();
    access = body.access;
  });

  it('me', async () => {
    const { body } = await http()
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(200);
    expect(body.email).toBe(email);
  });

  it('crear cuenta', async () => {
    const { body } = await http()
      .post('/v1/accounts')
      .set('Authorization', `Bearer ${access}`)
      .send({ name: 'Caja', currencyCode: 'ARS' })
      .expect(201);
    accountId = body.id;
    expect(body.name).toBe('Caja');
  });

  it('crear categoría', async () => {
    const { body } = await http()
      .post('/v1/categories')
      .set('Authorization', `Bearer ${access}`)
      .send({ name: 'Comida', type: 'EXPENSE' })
      .expect(201);
    categoryId = body.id;
    expect(body.name).toBe('Comida');
  });

  it('crear transacción', async () => {
    const today = new Date().toISOString().slice(0,10);
    const res = await http()
      .post('/v1/transactions')
      .set('Authorization', `Bearer ${access}`)
      .send({ accountId, categoryId, date: today, amount: 1200, note: 'Almuerzo' });

    expect([200,201]).toContain(res.status);
    expect(res.body.id).toBeTruthy();

    const txDb = await prisma.transaction.findUnique({ where: { id: res.body.id } });
    expect(txDb?.accountId).toBe(accountId);
    expect(txDb?.categoryId).toBe(categoryId);
  });

  it('listar transacciones', async () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
    const to = today.toISOString().slice(0,10);

    const res = await http()
      .get(`/v1/transactions?from=${from}&to=${to}`)
      .set('Authorization', `Bearer ${access}`);

    expect([200,201]).toContain(res.status);

    const items = Array.isArray(res.body) ? res.body : (res.body.items ?? []);
    expect(items.length).toBeGreaterThan(0);

    // Soporta ambas formas: con ids planos o con objetos anidados
    const found = items.find((t: any) =>
      (t.accountId ?? t.account?.id) === accountId &&
      (t.categoryId ?? t.category?.id) === categoryId
    );
    expect(found).toBeTruthy();
  });
});
