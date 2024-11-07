// app.module.ts
import { Module } from '@nestjs/common';
import { LedsController } from './app.controller';

@Module({
  controllers: [LedsController],
})
export class AppModule {}
