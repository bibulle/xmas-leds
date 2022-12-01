import { Module } from '@nestjs/common';
import { LedsController } from './leds.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [LedsController],
  imports: [HttpModule]
})
export class LedsModule {}
