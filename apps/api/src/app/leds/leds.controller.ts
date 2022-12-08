import { HttpService } from '@nestjs/axios';
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiReturn, Led } from '@xmas-leds/api-interfaces';
import { LedsService } from './leds.service';

@Controller('leds')
export class LedsController {
  readonly logger = new Logger(LedsController.name);

  constructor(private httpService: HttpService, private ledsService: LedsService) {}

  // ====================================
  // route getting status of ESP
  // ====================================
  @Get('/getStatus')
  async getLedStatus(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .getStatus()
        .then((s) => {
          resolve({ status: s });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // route for switch off all leds
  // ====================================
  @Get('/clear')
  async clearLeds(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .clearStrip()
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // route for change on some leds
  // ====================================
  @Post('/change')
  async changeLeds(@Body('leds') leds: Led[]): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      if (!leds) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      this.ledsService
        .changeStrip(leds)
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
}
