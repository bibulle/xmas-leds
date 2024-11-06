import { Module } from '@nestjs/common';
import { LedsController } from './leds.controller';
import { HttpModule } from '@nestjs/axios';
import { LedsService } from './leds.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [LedsController],
  imports: [HttpModule, ConfigModule],
  providers: [LedsService], 
  exports:[LedsService]
})
export class LedsModule {}
