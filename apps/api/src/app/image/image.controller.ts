import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
  StreamableFile
} from '@nestjs/common';
import { ApiReturn } from '@xmas-leds/api-interfaces';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';

@Controller('image')
export class ImageController {
  readonly logger = new Logger(ImageController.name);

  // ====================================
  // route for getting alreadycaptured image
  // ====================================
  @Get('/loadCapture/:angle/:index')
  async loadCapture(
    @Param('angle') angle: number,
    @Param('index') index: number,
    @Res({ passthrough: true }) res
  ): Promise<StreamableFile> {
    return new Promise<StreamableFile>((resolve) => {
      if (!existsSync(this.getFileName(angle, index))) {
        throw new HttpException('Capture not found', HttpStatus.NOT_FOUND);
      }

      const file = createReadStream(this.getFileName(angle, index));
      res.set({
        'Content-Type': 'image/jpg'
      });
      resolve(new StreamableFile(file));
    });
  }
  // ====================================
  // route for saving captured image
  // ====================================
  @Post('/saveCapture/:angle/:index')
  async saveCapture(
    @Param('angle') angle: number,
    @Param('index') index: number,
    @Body('image') base64: string
  ): Promise<ApiReturn> {
    // this.logger.debug(req.);
    // this.logger.debug(rating);

    return new Promise<ApiReturn>((resolve) => {
      console.log();

      if (!base64) {
        throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
      }
      // console.log(base64);

      mkdirSync('data/arbre', { recursive: true });
      const buffer = Buffer.from(base64, 'base64');
      writeFileSync(this.getFileName(angle, index), buffer);

      resolve({ ok: 'OK' });
    });
  }

  private getFileName(angle: number, index: number) {
    return `data/arbre/capture_${angle.toString().padStart(3, '0')}°_${index
      .toString()
      .padStart(3, '0')}.jpg`;
  }
}
