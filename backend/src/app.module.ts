import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config"
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReportsModule } from './reports/reports.module';
import { ImportsModule } from './imports/imports.module';
import { BudgetsModule } from './budgets/budgets.module';
import config from './config/config';
import { validationSchema } from './config/validation';
import { HealthModule } from './health/health.service';
import { CurrenciesModule } from './currencies/currencies.module';
import { FxModule } from './fx/fx.module';

@Module({
  imports: [AuthModule, UsersModule, AccountsModule, CategoriesModule, TransactionsModule, ReportsModule, ImportsModule, BudgetsModule, CurrenciesModule, FxModule, PrismaModule, HealthModule, ConfigModule.forRoot({ isGlobal: true, load: [config], validationSchema }), ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
