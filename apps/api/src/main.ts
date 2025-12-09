/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from './app/app.module';
import { ErrorFilter } from './app/interceptors/error.filter';
import { LoggingInterceptor } from './app/interceptors/logging.interceptor';

async function bootstrap() {
  // const httpService = new HttpService();
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ extended: true, limit: '500mb' }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new ErrorFilter());

  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
