import { HttpService } from '@nestjs/axios';
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiReturn, Led } from '@xmas-leds/api-interfaces';
import { LedsService } from './leds.service';

@Controller('leds')
export class LedsController {
  readonly logger = new Logger(LedsController.name);

  constructor(private httpService: HttpService, private ledsService: LedsService, private _configService: ConfigService) {}

  // ====================================
  // route getting status of ESP
  // ====================================
  @Get('/getStatus')
  async getLedStatus(): Promise<ApiReturn> {
    if (!this._configService.get('LEDS_IP')) {
      return { status: { defined: false } };
    }
    const s = await this.ledsService.getStatus();
    s.defined = true;
    return { status: s };
  }

  // ====================================
  // route for switch off all leds
  // ====================================
  @Get('/clear')
  async clearLeds(): Promise<ApiReturn> {
    const m = await this.ledsService.clearStrip();
    return { ok: m };
  }

  // ====================================
  // route for change on some leds
  // ====================================
  @Post('/change')
  async changeLeds(@Body('leds') leds: Led[]): Promise<ApiReturn> {
    if (!leds) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }

    const m = await this.ledsService.changeStrip(leds);
    return { ok: m };
  }
}
