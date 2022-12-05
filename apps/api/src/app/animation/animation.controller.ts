import { Body, Controller, Get, HttpException, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiReturn, LedAnimation } from '@xmas-leds/api-interfaces';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { LedsService } from '../leds/leds.service';

@Controller('anim')
export class AnimationController {
  readonly logger = new Logger(AnimationController.name);

  constructor(private ledsService: LedsService) {}

  // ====================================
  // route to save animation files
  // ====================================
  @Post('/save')
  async saveAnim(@Body('anim') anim: LedAnimation): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      // this.logger.log(anim)
      if (!anim || !anim.lines || anim.lines.length === 0) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      // console.log(lines);
      let content = '';
      anim.lines.forEach((line) => {
        content += `${line.duration}, `;
        line.leds.forEach((led, index) => {
          content += `${index == 0 ? '' : ', '}${led.index} ${led.r} ${led.g} ${led.b}`;
        });
        content += '\r\n';
      });
      // this.logger.log(content);

      mkdirSync('data/animations', { recursive: true });

      let currentContent = '';
      let fileAlreadyExists = false;
      if (existsSync(this.getFileName(anim.titre))) {
        currentContent = readFileSync(this.getFileName(anim.titre)).toString();
        fileAlreadyExists = true;
      }

      if (currentContent === content) {
        return resolve({ ok: 'No need to save' });
      }

      this.logger.debug(`trying to save anim '${anim.titre}'`);

      // save previous file
      if (fileAlreadyExists) {
        let cpt = 1;
        while (existsSync(this.getFileName(anim.titre, cpt))) {
          cpt++;
        }
        renameSync(this.getFileName(anim.titre), this.getFileName(anim.titre, cpt));
      }

      writeFileSync(this.getFileName(anim.titre), Buffer.from(content));

      resolve({ ok: 'OK' });
    });
  }

  // ====================================
  // Route to push file to strips
  // ====================================
  @Get('push/:name')
  async sendAnimToTree(@Param('name') name: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      const fileName = this.getFileName(name);

      this.ledsService
        .uploadToStrip(name, fileName)
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // Route to get all already stored anim
  // ====================================
  @Get('')
  async getFiles(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const lst = readdirSync('data/animations')
        .filter((f) => f.endsWith('.csv'))
        .map((f) => f.slice(0, -4));

      this.logger.log(lst);

      resolve({ animations: lst });
    });
  }

  getFileName(name: string, id: number = undefined): string {
    if (!id) {
      return `data/animations/${name}.csv`;
    } else {
      return `data/animations/${name}_${('' + id).padStart(4, '0')}.csv`;
    }
  }
}
