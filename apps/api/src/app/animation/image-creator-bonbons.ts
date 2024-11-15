import { Logger } from '@nestjs/common';
import { Color } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';

export class ImageCreatorBonbons extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorBonbons.name);

  name: string = 'Bonbons';
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

    // On fait les bandes noires
    let departs = [];
    for (let i = -width / 5; i < width / 5; i++) {
      departs.push(i);
      departs.push(width / 2 + i);
    }
    departs.forEach((depart) => {
      let x = 0;
      let y = depart + height - frameId;
      for (let i = 0; i < width; i++) {
        x = (x + 1) % width;
        y = (height + y - 0.5) % height;
        frame[Math.floor(y)][Math.floor(x)] = new Color(0, 0, 0);
      }
    });

    // On fait les bandes rouges
    departs = [];
    for (let i = -width / 10; i < width / 10; i++) {
      departs.push(i);
      departs.push(width / 2 + i);
    }
    departs.forEach((depart) => {
      let x = 0;
      let y = depart + height - frameId;
      for (let i = 0; i < width; i++) {
        x = (x + 1) % width;
        y = (height + y - 0.5) % height;
        frame[Math.floor(y)][Math.floor(x)] = new Color(255, 0, 0);
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
