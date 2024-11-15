import { Body, Controller, Delete, FileTypeValidator, Get, HttpException, HttpStatus, Logger, MaxFileSizeValidator, Param, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiReturn, Led, LedAnimation, Line } from '@xmas-leds/api-interfaces';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import 'multer';
import { diskStorage } from 'multer';
import { LedsService } from '../leds/leds.service';
import { AnimationService } from './animation.service';

@Controller('anim')
export class AnimationController {
  readonly logger = new Logger(AnimationController.name);

  constructor(private ledsService: LedsService, private animationService: AnimationService) {
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

      // Create the contents
      // console.log(lines);
      let content = '';
      // add anim title
      content += `# ${anim.titre}\r\n`;
      // add anim options
      content += `# ${JSON.stringify(anim.options)}\r\n`;
      // add lines

      const previousLineMap = new Map<number, Led>();

      anim.lines.forEach((line, lineIndex) => {
        content += `${line.duration}, `;
        let ledWritten = 0;

        line.leds = line.leds.sort((a, b) => {
          return a.index - b.index;
        });

        if (lineIndex < 2) this.logger.log(`line ${lineIndex} led ${line.leds.length}`);
        line.leds.forEach((led) => {
          const previousLed = previousLineMap.get(led.index);
          if (lineIndex < 2) this.logger.log(`line ${lineIndex} led ${led.index} value ${ledWritten} ${previousLed}`);

          // Vérifier si la LED a été modifiée par rapport à la ligne précédente
          if (
            lineIndex === 0 || // Toujours inclure la première ligne entière
            !previousLed || // Inclure si aucune LED précédente pour comparer
            previousLed.r !== led.r ||
            previousLed.g !== led.g ||
            previousLed.b !== led.b
          ) {
            content += `${ledWritten === 0 ? '' : ', '}${led.index} ${led.r} ${led.g} ${led.b}`;
            ledWritten++;
          }
        });
        content += '\r\n';

        // Mettre à jour previousLineMap pour la prochaine ligne
        previousLineMap.clear();
        line.leds.forEach((led) => {
          previousLineMap.set(led.index, led);
        });
      });

      // this.logger.log(content);

      mkdirSync('data/animations', { recursive: true });

      // If file exist, check if something change
      // let currentContent = '';
      // if (existsSync(this.getFileName(anim.titre))) {
      //   currentContent = readFileSync(this.getFileName(anim.titre)).toString();
      // }
      // if (currentContent === content) {
      //   return resolve({ ok: 'No need to save' });
      // }

      anim.titre = anim.titre.replace(/_[0-9]*$/, '');

      // Save the csv
      this.logger.debug(`trying to save anim '${anim.titre}'`);
      // save previous file
      let cpt = 1;
      while (existsSync(this.animationService.getFileName(anim.titre, cpt))) {
        cpt++;
      }
      writeFileSync(this.animationService.getFileName(anim.titre, cpt), Buffer.from(content));
      // rename on the esp
      // this.ledsService.renameAnim(basename(this.getFileName(anim.titre)), basename(this.getFileName(anim.titre, cpt))).catch((reason) => {
      //   this.logger.error(reason);
      // });

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

      const fileName = this.animationService.getFileName(name);

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
          // this.logger.log(m);
          resolve({ animations: m.animations });
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

      const fileName = this.animationService.getFileName(name);

      this.ledsService
        .uploadToStrip(name, fileName, false)
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
  // route to get animation images from backend
  // ====================================
  @Get('/images')
  async getImageAnimations(): Promise<ApiReturn> {
    const animations = await this.animationService.getAllImageAnimations();

    return { images: animations };
  }

  // ====================================
  // route to get animation files from backend
  // ====================================
  @Get(':name')
  async getAnim(@Param('name') name: string): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      if (!name) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      const fileName = this.animationService.getFileName(name);

      if (!existsSync(fileName)) {
        throw new HttpException('Animation not found', HttpStatus.NOT_FOUND);
      }

      const lines: Line[] = [];
      let options = [];
      const content = readFileSync(fileName).toString();
      content.split(/\r?\n/).forEach((lineStr, index) => {
        if (lineStr.startsWith('# ')) {
          if (index == 1) {
            options = JSON.parse(lineStr.replace(/^# /, ''));
          }
        } else {
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
                if (l === '') {
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
        }
      });

      resolve({ anim: { titre: name, existOnBackend: true, existOnTree: false, lines: lines, options: options } });
    });
  }
}
