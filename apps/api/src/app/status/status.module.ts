import { Module } from '@nestjs/common';
import { StatusGateway } from './status.gateway';
import { StatusService } from './status.service';
import { LedsModule } from '../leds/leds.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [StatusGateway, StatusService],
  controllers: [],
  imports: [LedsModule, ConfigModule],
  exports: [StatusGateway],
})
export class StatusModule {}
