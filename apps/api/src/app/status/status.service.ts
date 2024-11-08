import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LedsService } from '../leds/leds.service';
import { StatusGateway } from './status.gateway';
import { LedsStatus } from '@xmas-leds/api-interfaces';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(private ledsService: LedsService, private _configService: ConfigService, private _statusGateway: StatusGateway) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkStatus() {

    let status:LedsStatus = { defined: false };

    if (this._configService.get('LEDS_IP')) {
        const s = await this.ledsService.getStatus();
        status = s;
        status.defined = true;
    }

    this._statusGateway.sendStatus(status);

  }
}