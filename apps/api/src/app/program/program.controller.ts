import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiReturn, LedProgram } from '@xmas-leds/api-interfaces';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import 'multer';
import { LedsService } from '../leds/leds.service';
import { AnimationService } from '../animation/animation.service';

@Controller('program')
export class ProgramController {
  readonly logger = new Logger(ProgramController.name);

  constructor(private ledsService: LedsService, private animationService: AnimationService) {
    // MulterModule.register({
    //   dest: './upload',
    // });
  }

  // ====================================
  // route to get animation files from backend
  // ====================================
  @Get()
  async getProgram(): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      const fileName = this.getFileName();

      if (!existsSync(fileName)) {
        throw new HttpException('Program not found', HttpStatus.NOT_FOUND);
      }

      const program = new LedProgram();

      const content = readFileSync(fileName).toString();
      content.split(/\r?\n/).forEach((lineStr) => {
        const lineSplit = lineStr.split(/ /).map((s) => s.trim());
        if (lineSplit.length > 0) {
          program.anims.push(lineSplit[0]);
          program.repeat[lineSplit[0]] = +lineSplit[1];
        }
      });

      // this.logger.debug(JSON.stringify(program));
      resolve({ program: program });
    });
  }

  // ====================================
  // route to save program files to the backend
  // ====================================
  @Post('/save')
  async saveProgram(@Body('program') program: LedProgram): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve) => {
      // this.logger.log(anim)
      if (!program || !program.repeat || program.repeat.length === 0) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }

      // Create the content
      const content = program.anims.map((key) => `${key} ${program.repeat[key]}`).join('\n');
      // this.logger.log(content);

      mkdirSync('data', { recursive: true });

      // Save
      this.logger.debug(`trying to save program`);
      writeFileSync(this.getFileName(), Buffer.from(content));

      resolve({ ok: 'Saved' });
    });
  }

  // ====================================
  // route to send program files to the tree
  // ====================================
  @Post('/sendToTree')
  async sendToTree(@Body('program') program: LedProgram): Promise<ApiReturn> {
    return new Promise<ApiReturn>((resolve, reject) => {
      // Save program to backend
      this.saveProgram(program)
        .then(() => {
          // Clear all on the tree
          this.ledsService
            .deleteFromStripAll()
            .then(() => {
              // For each animation used in the program, send it to the tree
              program.anims
                .filter((a) => {
                  return program.repeat[a] !== 0;
                })
                .reduce((cur, anim) => {
                  return cur.then(() => {
                    return new Promise<string>((resolve, reject) => {
                      this.logger.debug(`Start ${anim}`);
                      const fileName = this.animationService.getFileName(anim);
                      this.ledsService
                        .uploadToStrip(anim, fileName)
                        .then(() => {
                          resolve(`OK   ${anim}`);
                        })
                        .catch((reason) => {
                          reject(reason);
                        });
                    });
                  });
                }, Promise.resolve())
                .then((v) => {
                  this.logger.debug(`ALL OK   ${v}`);
                  resolve({ok: "program saved"});
                })
                .catch((reason) => {
                  reject(reason);
                });
            })
            .catch((reason) => {
              reject(reason);
            });
        })
        .catch((reason) => {
          reject(reason);
        });
      // .then( (ret) => {

      //   this.ledsService.deleteFromStripAll().then;

      //   // remove all files from leds
      //   const promises: Promise<string>[] = [];
      //   // promises.push(this.ledsService.deleteFromStripAll());
      //   for (let i = 0; i < 10; i++) {
      //     promises.push(
      //       new Promise<string>((resolve, reject) => {
      //         this.logger.debug(`Start ${i}`);
      //         setTimeout(() => {
      //           this.logger.debug(`End   ${i}`);
      //           resolve('OK');
      //         }, 2000);
      //       })
      //     );
      //   }

      //   // let result = Promise.resolve("OK");
      //   for (let i = 0; i < promises.length; i++) {
      //     const p = promises[i];
      //     await p.then(s => {
      //       this.logger.debug(`??? ${s}   ${i}`);
      //     });
      //   }
      //   resolve({ ok: 'Sended' });

      // })
      // .catch((reason) => {
      //   reject(reason);
      // });
    });
  }

  // // ====================================
  // // route to upload animation files to the backend
  // // ====================================
  // @Post('/upload')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './data/animations/',
  //       filename: (req, file, callback) => {
  //         callback(null, file.originalname);
  //       },
  //     }),
  //   })
  // )
  // async uploadAnim(
  //   @UploadedFile(
  //     new ParseFilePipe({
  //       validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 }), new FileTypeValidator({ fileType: 'csv' })],
  //     })
  //   )
  //   file: Express.Multer.File
  // ): Promise<ApiReturn> {
  //   return new Promise<ApiReturn>((resolve) => {
  //     this.logger.log(`save file to '${file.path}'`);
  //     resolve({ ok: 'OK' });
  //   });
  // }

  // // ====================================
  // // route to delete animation files from backend
  // // ====================================
  // @Delete(':name')
  // async deleteAnim(@Param('name') name: string): Promise<ApiReturn> {
  //   return new Promise<ApiReturn>((resolve) => {
  //     if (!name) {
  //       throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
  //     }

  //     const fileName = this.getFileName(name);

  //     if (!existsSync(fileName)) {
  //       throw new HttpException('Animation not found', HttpStatus.NOT_FOUND);
  //     }

  //     unlinkSync(fileName);

  //     resolve({ ok: 'OK' });
  //   });
  // }

  // // ====================================
  // // Route to get all already stored anim in the led strips
  // // ====================================
  // @Get('leds')
  // async getAnimsFromStrip(): Promise<ApiReturn> {
  //   return new Promise<ApiReturn>((resolve, reject) => {
  //     this.ledsService
  //       .getAnimsFromStrip()
  //       .then((m) => {
  //         // this.logger.log(m);
  //         resolve({ animations: m.animations });
  //       })
  //       .catch((reason) => {
  //         reject(reason);
  //       });
  //   });
  // }

  // // ====================================
  // // Route to get all already stored anim in the backend
  // // ====================================
  // @Get('')
  // async getFiles(): Promise<ApiReturn> {
  //   return new Promise<ApiReturn>((resolve) => {
  //     const lst = readdirSync('data/animations')
  //       .filter((f) => f.endsWith('.csv'))
  //       .map((f) => f.slice(0, -4));

  //     // this.logger.log(lst);

  //     resolve({ animations: lst });
  //   });
  // }

  // // ====================================
  // // Route to push file to strips (from backend)
  // // ====================================
  // @Get('leds/push/:name')
  // async sendAnimToTree(@Param('name') name: string): Promise<ApiReturn> {
  //   return new Promise<ApiReturn>((resolve, reject) => {
  //     if (!name) {
  //       throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
  //     }

  //     const fileName = this.getFileName(name);

  //     this.ledsService
  //       .uploadToStrip(name, fileName)
  //       .then((m) => {
  //         resolve({ ok: m });
  //       })
  //       .catch((reason) => {
  //         reject(reason);
  //       });
  //   });
  // }

  // // ====================================
  // // route to delete animation files from strip
  // // ====================================
  // @Delete('/leds/:name')
  // async deleteAnimFromStrip(@Param('name') name: string): Promise<ApiReturn> {
  //   if (!name) {
  //     throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
  //   }

  //   return new Promise<ApiReturn>((resolve, reject) => {
  //     this.ledsService
  //       .deleteFromStrip(name)
  //       .then((m) => {
  //         resolve({ ok: m });
  //       })
  //       .catch((reason) => {
  //         reject(reason);
  //       });
  //   });
  // }

  // // ====================================
  // // route to exec animation on strip
  // // ====================================
  // @Get('/leds/exec/:name')
  // async execAnimOnStrip(@Param('name') name: string): Promise<ApiReturn> {
  //   if (!name) {
  //     throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
  //   }

  //   return new Promise<ApiReturn>((resolve, reject) => {
  //     this.ledsService
  //       .execOnStrip(name)
  //       .then((m) => {
  //         resolve({ ok: m });
  //       })
  //       .catch((reason) => {
  //         reject(reason);
  //       });
  //   });
  // }

  // // ====================================
  // // route to stop animations on strip
  // // ====================================
  // @Get('/stop')
  // async stopAnims(): Promise<ApiReturn> {
  //   // this.logger.log("stopAnims");
  //   return new Promise<ApiReturn>((resolve, reject) => {
  //     this.ledsService
  //       .stopAnims()
  //       .then((m) => {
  //         resolve({ ok: m });
  //       })
  //       .catch((reason) => {
  //         reject(reason);
  //       });
  //   });
  // }

  // // ====================================
  // // route to start animations on strip
  // // ====================================
  // @Get('/start')
  // async startAnims(): Promise<ApiReturn> {
  //   // this.logger.log("startAnims");
  //   return new Promise<ApiReturn>((resolve, reject) => {
  //     this.ledsService
  //       .startAnims()
  //       .then((m) => {
  //         resolve({ ok: m });
  //       })
  //       .catch((reason) => {
  //         reject(reason);
  //       });
  //   });
  // }

  // methode to get filename in the backend from an ani name
  getFileName(): string {
    return `data/program.csv`;
  }
}
