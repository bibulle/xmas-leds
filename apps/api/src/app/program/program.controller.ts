import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiReturn, LedProgram } from '@xmas-leds/api-interfaces';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync, writeSync } from 'fs';
import 'multer';
import { tmpdir } from 'os';
import { basename, join } from 'path';
import { AnimationService } from '../animation/animation.service';
import { LedsService } from '../leds/leds.service';
import { StatusGateway } from '../status/status.gateway';

@Controller('program')
export class ProgramController {
  readonly logger = new Logger(ProgramController.name);

  constructor(private ledsService: LedsService, private animationService: AnimationService, private readonly progressGateway: StatusGateway) {
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
      this.logger.debug(`Start save program on server`);
      writeFileSync(this.getFileName(), Buffer.from(content));
      this.logger.debug(`OK    save program on server`);

      resolve({ ok: 'Saved' });
    });
  }

  // ====================================
  // route to send program files to the tree
  // ====================================
  @Post('/sendToTree')
  async sendToTree(@Body('program') program: LedProgram, @Body('divisor') divisor: number): Promise<ApiReturn> {
    try {

      const cptProgressMax = program.anims.filter((a) => program.repeat[a] !== 0).length + 3;
      let cptProgress = 0;

      this.progressGateway.sendProgress(100*cptProgress++/cptProgressMax);

      // Save program to backend
      await this.saveProgram(program);

      this.progressGateway.sendProgress(100*cptProgress++/cptProgressMax);

      // Clear all on the tree
      await this.ledsService.deleteFromStripAll();

      // Filter and send each animation to the tree based on repeat count
      for (const anim of program.anims.filter((a) => program.repeat[a] !== 0)) {

        this.progressGateway.sendProgress(100*cptProgress++/cptProgressMax);

        this.logger.debug(`Start pushing ${anim} to tree`);
        const fileName = this.animationService.getFileName(anim);

        const binaryPath = await this.convertCSVToBinary(fileName, divisor);
        this.logger.debug(`binaryPath: ${binaryPath}`);

        // Upload animation to the tree
        await this.ledsService.uploadToStrip(anim, binaryPath, true);

        //unlinkSync(binaryPath);

        this.logger.debug(`OK    pushing ${anim} to tree`);
      }

      this.progressGateway.sendProgress(100*cptProgress++/cptProgressMax);

      this.logger.debug(`Start pushing program to tree`);
      await this.ledsService.uploadToStrip(basename(this.getFileName(), '.csv'), this.getFileName(), false);
      this.logger.debug(`OK    pushing program to tree`);

      this.progressGateway.sendProgress(100*cptProgress++/cptProgressMax);

      this.logger.debug(`sendToTree fully OK`);
      return { ok: 'program saved' };
    } catch (error) {
      // Log error and reject with a reason
      this.logger.error('Error sending program to tree', error);
      throw error;
    }
  }

  async convertCSVToBinary(csvPath: string, divisor: number): Promise<string> {
    //console.log(`Conversion du fichier CSV ${csvPath} en format binaire`);

    // Vérification de l'extension .csv et création du chemin .bin
    if (!csvPath.endsWith('.csv')) {
      throw new Error("Erreur : Le fichier source doit avoir l'extension .csv");
    }

    // Création d'un fichier temporaire pour le fichier binaire
    const binaryPath = join(tmpdir(), basename(csvPath).replace('.csv', '.bin'));

    try {
      // Lecture du fichier CSV et ouverture du fichier binaire
      const csvData = readFileSync(csvPath, 'utf-8').split('\n');
      const binFile = openSync(binaryPath, 'w');

      for (let line of csvData) {
        line = line.trim();
        // Ignorer les lignes de commentaire
        if (line.startsWith('#') || line === '') continue;

        // Séparer la durée et les données LED
        // eslint-disable-next-line prefer-const
        let [durationStr, ...ledDataArray] = line.split(',');
        const duration = parseInt(durationStr);
        const durationBuffer = Buffer.alloc(2);
        durationBuffer.writeUInt16LE(duration);
        writeSync(binFile, durationBuffer);

        // Compter le nombre de LEDs
        if (ledDataArray.length === 1 && ledDataArray[0].trim() === "") {
          ledDataArray = [];
        }
        const numLeds = ledDataArray.length;
        const numLedsBuffer = Buffer.alloc(2);
        numLedsBuffer.writeUInt16LE(numLeds);
        writeSync(binFile, numLedsBuffer);

        // Traiter les données de chaque LED
        for (const segment of ledDataArray) {
          const trimmedSegment = segment.trim();
          const [idStr, rStr, gStr, bStr] = trimmedSegment.split(' ');

          // Convertir les valeurs en entiers
          const id = parseInt(idStr);
          const r = Math.round(parseInt(rStr)/divisor);
          const g = Math.round(parseInt(gStr)/divisor);
          const b = Math.round(parseInt(bStr)/divisor);

          // Créer un buffer pour chaque LED
          const ledBuffer = Buffer.alloc(5); // 2 octets pour ID + 3 octets pour RGB
          ledBuffer.writeUInt16LE(id, 0);    // Écrit l'ID sur 2 octets (little-endian)
          ledBuffer.writeUInt8(r, 2);        // Écrit R sur 1 octet
          ledBuffer.writeUInt8(g, 3);        // Écrit G sur 1 octet
          ledBuffer.writeUInt8(b, 4);        // Écrit B sur 1 octet
          writeSync(binFile, ledBuffer);
        }
      }

      closeSync(binFile);
      //console.log('Conversion terminée avec succès !');
      return binaryPath;
    } catch (error) {
      console.error('Erreur lors de la conversion :', error);
      throw error;
    }
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
  //         callback(null, file.originalName);
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

  // method to get filename in the backend from an ani name
  getFileName(): string {
    return `data/program.csv`;
  }
}
