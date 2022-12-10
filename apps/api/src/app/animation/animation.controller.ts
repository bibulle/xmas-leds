import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Res, UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiReturn, Led, LedAnimation, Line } from '@xmas-leds/api-interfaces';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import 'multer';
import { diskStorage } from 'multer';
import { LedsService } from '../leds/leds.service';

@Controller('anim')
export class AnimationController {
  readonly logger = new Logger(AnimationController.name);

  constructor(private ledsService: LedsService) {
    // MulterModule.register({
    //   dest: './upload',
    // });
  }

  // ====================================
  // route to save animation files to the backend
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
  // route to upload animation files to the backend
  // ====================================
  @Post('/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './data/animations/',
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
    })
  )
  async uploadAnim(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 }), new FileTypeValidator({ fileType: 'csv' })],
      })
    )
    file: Express.Multer.File
  ): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      this.logger.log(`save file to '${file.path}'`);
      resolve({ ok: 'OK' });
    });
  }

  // ====================================
  // route to delete animation files from backend
  // ====================================
  @Delete(':name')
  async deleteAnim(@Param('name') name: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      if (!name) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      const fileName = this.getFileName(name);

      if (!existsSync(fileName)) {
        throw new HttpException('Animation not found', HttpStatus.NOT_FOUND);
      }

      unlinkSync(fileName);

      resolve({ ok: 'OK' });
    });
  }

  // ====================================
  // Route to get all already stored anim in the led strips
  // ====================================
  @Get('leds')
  async getAnimsFromStrip(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .getAnimsFromStrip()
        .then((m) => {
          resolve({ animations: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // Route to get all already stored anim in the backend
  // ====================================
  @Get('')
  async getFiles(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const lst = readdirSync('data/animations')
        .filter((f) => f.endsWith('.csv'))
        .map((f) => f.slice(0, -4));

      // this.logger.log(lst);

      resolve({ animations: lst });
    });
  }

  // ====================================
  // Route to push file to strips (from backend)
  // ====================================
  @Get('leds/push/:name')
  async sendAnimToTree(@Param('name') name: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      if (!name) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

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
  // route to delete animation files from strip
  // ====================================
  @Delete('/leds/:name')
  async deleteAnimFromStrip(@Param('name') name: string): Promise<ApiReturn> {
    if (!name) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }

    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .deleteFromStrip(name)
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // route to exec animation on strip
  // ====================================
  @Get('/leds/exec/:name')
  async execAnimOnStrip(@Param('name') name: string): Promise<ApiReturn> {
    if (!name) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }

    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .execOnStrip(name)
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // route to stop animations on strip
  // ====================================
  @Get('/stop')
  async stopAnims(): Promise<ApiReturn> {
    // this.logger.log("stopAnims");
    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .stopAnims()
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // ====================================
  // route to start animations on strip
  // ====================================
  @Get('/start')
  async startAnims(): Promise<ApiReturn> {
    // this.logger.log("startAnims");
    return new Promise<ApiReturn>((resolve, reject) => {
      this.ledsService
        .startAnims()
        .then((m) => {
          resolve({ ok: m });
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

    // ====================================
  // route to get animation files from backend
  // ====================================
  @Get(':name')
  async getAnim(@Param('name') name: string, @Res({ passthrough: true }) res): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      if (!name) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      const fileName = this.getFileName(name);

      if (!existsSync(fileName)) {
        throw new HttpException('Animation not found', HttpStatus.NOT_FOUND);
      }

      const lines: Line[] = [];
      const content = readFileSync(fileName).toString();
      content.split(/\r?\n/).forEach((lineStr, index) => {
        const lineSplit = lineStr.split(/,/).map((s) => s.trim());

        if (lineSplit.length > 0) {
          const duration = +lineSplit[0];
          const leds: Led[] = lineSplit
            .filter((v, i) => i > 0)
            .map((l) => {
              const numbers = l
                .split(/ /)
                .map((s) => s.trim())
                .map((v) => +v);
              if (l === "") {
                return undefined;
              } else if (numbers.length != 4) {
                this.logger.error(`line ${index + 1} : '${lineStr}'`);
                throw new HttpException(`Format error in anim '${name}' (line ${index + 1})`, HttpStatus.INTERNAL_SERVER_ERROR);
              }
              return { index: numbers[0], r: numbers[1], g: numbers[2], b: numbers[3] };
            })
            .filter((l) => l !== undefined);
          // this.logger.debug(leds);
          lines.push({ duration: duration, leds: leds });
        }
      });

      resolve({ anim: { titre: name, existOnBackend: true, existOnTree: false, lines: lines } });
    });
  }

  // methode to get filename in the backend from an ani name
  getFileName(name: string, id: number = undefined): string {
    if (!id) {
      return `data/animations/${name}.csv`;
    } else {
      return `data/animations/${name}_${('' + id).padStart(4, '0')}.csv`;
    }
  }
}
