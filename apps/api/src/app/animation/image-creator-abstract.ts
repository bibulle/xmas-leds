import { Logger } from '@nestjs/common';
import { Color, ImageAnimation, ImageAnimationColor } from '@xmas-leds/api-interfaces';

export abstract class ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorAbstract.name);

  abstract name: string;
  abstract width: number;
  abstract height: number;
  abstract defaultColors: ImageAnimationColor[];

  create(colors?: Color[]): ImageAnimation {
    this.logger.debug(`Creating image: ${this.name}`);
    return {
      name: this.name,
      frames: this.generateAnimationFrames(this.width, this.height, colors),
      defaultColors: this.defaultColors,
    };
  }

  abstract generateAnimationFrames(width: number, height: number, colors?: Color[]): Color[][][];
}
