import { Logger } from '@nestjs/common';
import { Color, ImageAnimationColor } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';

export class ImageCreatorHautBas extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorHautBas.name);

  name: string = 'Haut-Bas';
  width = 15;
  height = 15;
  defaultColors: ImageAnimationColor[] = [
    new ImageAnimationColor('Couleur Haut', new Color(0, 0, 255)),
    new ImageAnimationColor('Couleur Bas', new Color(255, 0, 0)),
  ];

  // Fonction pour créer une frame en déplaçant le dégradé vers le bas
  createFrame(frameId: number, width: number, height: number, colorTop: Color, colorBottom: Color) {
    const frame = [];
    // Utilise l'offset pour décaler le gradient verticalement
    for (let x = 0; x < height; x++) {
      let color1 = new Color(0, 0, 0);
      let color2 = new Color(0, 0, 0);
      if (x < frameId) {
        const ratio = 1 - (frameId - x) / height;
        color1 = new Color(colorTop.r * ratio, colorTop.g * ratio, colorTop.b * ratio);
      }
      if (height - x < frameId) {
        const ratio = 1 - (frameId - (height - x)) / height;
        color2 = new Color(colorBottom.r * ratio, colorBottom.g * ratio, colorBottom.b * ratio);
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
  generateAnimationFrames(width: number, height: number, colors?: Color[]) {
    const colorTop = colors?.[0] ?? this.defaultColors[0].color;
    const colorBottom = colors?.[1] ?? this.defaultColors[1].color;

    const frames = [];

    for (let i = 0; i < 2 * height; i++) {
      const frame = this.createFrame(i, width, height, colorTop, colorBottom);
      frames.push(frame);
    }
    return frames;
  }
}
  