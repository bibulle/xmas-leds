import { Logger } from '@nestjs/common';
import { ImageCreatorAbstract } from './image-creator-abstract';
import { Color } from '@xmas-leds/api-interfaces';

export class ImageCreatorSnow extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorSnow.name);

  name: string = 'Neige';
  width = 20;
  height = 20;

  // Fonction pour créer une frame en déplaçant le dégradé vers le bas
  createFrame(frameId: number, width: number, height: number) {
    const frame = [];
    // Utilise l'offset pour décaler le gradient verticalement
    for (let x = 0; x < height; x++) {
      let color = new Color(0, 0, 0);
      if (x < frameId) {
        color = new Color(255, 255, 255);
      }
      const line = [];
      for (let y = 0; y < width; y++) {
        line.push(color);
      }
      frame.push(line);
    }

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
