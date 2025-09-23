import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import pino from 'pino-http';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from "./common/filters/prisma-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/loggin.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  const docBuild = new DocumentBuilder().setTitle('Expenses API').addBearerAuth().build();
  const doc = SwaggerModule.createDocument(app, docBuild);
  SwaggerModule.setup('docs', app, doc);
  app.enableCors({ origin: cfg.get<string[]>('corsOrigin'), credentials: true });
  app.use(cookieParser());
  app.use(helmet());
  app.use(pino());
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
