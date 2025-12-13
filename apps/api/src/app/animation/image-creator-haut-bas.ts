import { Logger } from '@nestjs/common';
import { Color } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';

export class ImageCreatorHautBas extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorHautBas.name);

  name: string = 'Haut-Bas';
  width = 15;
  height = 15;

    // Fonction pour créer une frame en déplaçant le dégradé vers le bas
    createFrame(frameId: number, width: number, height: number) {
      const frame = [];
      // Utilise l'offset pour décaler le gradient verticalement
      for (let x = 0; x < height; x++) {
        let color1 = new Color(0, 0, 0);
        let color2 = new Color(0, 0, 0);
        if (x < frameId) {
          const r = 0 * (1-(frameId-x)/height);
          const g = 0 * (1-(frameId-x)/height);
          const b = 255 * (1-(frameId-x)/height);
          color1 = new Color(r, g, b);
        }
        if ((height-x) < frameId) {
          const r = 255 * (1-(frameId-(height-x))/height);
          const g = 0 * (1-(frameId-x)/height);
          const b = 0 * (1-(frameId-x)/height);
          color2 = new Color(r, g, b);
        }
        const line = [];
        for (let y = 0; y < width; y++) {
          line.push(Color.merge(color1, color2));
        }
        frame.push(line);
      }
  
      return frame;
    }
  
    // Génère toutes les frames de l'animation
    generateAnimationFrames(width: number, height: number) {
      const frames = [];

      // Reduced: height frames instead of 2*height (interpolation will fill gaps)
      for (let i = 0; i < height; i++) {
        const frame = this.createFrame(i, width, height);
        frames.push(frame);
      }
      return frames;
    }
  }
  