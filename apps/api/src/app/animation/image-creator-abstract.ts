import { Logger } from '@nestjs/common';
import { Color, ImageAnimation } from '@xmas-leds/api-interfaces';

export abstract class ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorAbstract.name);

  abstract name: string;
  abstract width: number;
  abstract height: number;

  create(): ImageAnimation {
    this.logger.debug(`Creating image: ${this.name}`);
    return {
        name: this.name,
        frames: this.generateAnimationFrames(this.width, this.height)
    }
}
    abstract generateAnimationFrames(width: number, height: number): Color[][][];

}
