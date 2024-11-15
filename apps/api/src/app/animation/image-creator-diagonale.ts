import { Logger } from '@nestjs/common';
import { Color } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';

export class ImageCreatorDiagonale extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorDiagonale.name);

  name: string = 'Diagonale';
  width = 20;
  height = 20;

  // Fonction pour créer une frame en déplaçant le dégradé vers le bas
  createFrame(frameId: number, width: number, height: number) {
    const frame = [];
    // on initialise tous a blanc
    for (let x = 0; x < height; x++) {
      const line = [];
      const color = new Color(255, 255, 255);
      for (let y = 0; y < width; y++) {
        line.push(color);
      }
      frame.push(line);
    }

    const departs = [];
    for (let i = 0; i < width/4; i++) {
      departs.push(i);
      departs.push(width / 2+i);
    }
    departs.forEach((depart) => {
      this.logger.log(`depart : ${depart}`);
      
      let x = 0;
      let y = depart+height-frameId;
      for (let i = 0; i < width; i++) {
        x = (x + 1) % width;
        y = (y + 1) % height;
        frame[Math.floor(y)][Math.floor(x)] = new Color(0, 0, 255);
      }
    });
 
    return frame;
  }

  // Génère toutes les frames de l'animation
  generateAnimationFrames(width: number, height: number) {
    const frames = [];

    for (let i = 0; i < height; i++) {
      const frame = this.createFrame(i, width, height);
      frames.push(frame);
    }
    return frames;
  }
}
