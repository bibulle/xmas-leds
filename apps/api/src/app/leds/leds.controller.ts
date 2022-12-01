import { HttpService } from '@nestjs/axios';
import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiReturn } from '@xmas-leds/api-interfaces';


@Controller('leds')
export class LedsController {
  readonly logger = new Logger(LedsController.name);

    private readonly LEDS_IP="192.168.1.31"

    constructor(private httpService: HttpService) {}

  // ====================================
  // route for switch off all leds
  // ====================================
  @Get('/clear')
  async clearLeds(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      this.httpService.get<ApiReturn>(`http://${this.LEDS_IP}/strip/clear`, {timeout: 4000}).subscribe({
        next: () => {
          resolve({ok: "Led off"});
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR))
        },
      });
    });
  }

   // ====================================
  // route for change on some leds
  // ====================================
  @Post('/change')
  async changeLeds(@Body('leds') leds: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {

      if (!leds) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      const body= `leds=${leds}`;

      this.httpService.post<ApiReturn>(`http://${this.LEDS_IP}/strip/change`, body, {timeout: 4000}).subscribe({
        next: () => {
          resolve({ok: "Led changed"});
        },
        error: (error) => {
          this.logger.error(`${error.message} : ${error.response?.data} (${error.request.path})`);    
          reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR))
        },
      });
    });
  }

}
