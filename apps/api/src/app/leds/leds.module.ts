import { Module } from '@nestjs/common';
import { LedsController } from './leds.controller';
import { HttpModule } from '@nestjs/axios';
import { LedsService } from './leds.service';

@Module({
  controllers: [LedsController],
  imports: [HttpModule],
  providers: [LedsService], 
  exports:[LedsService]
})
export class LedsModule {}
