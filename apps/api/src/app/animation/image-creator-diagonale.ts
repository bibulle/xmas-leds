import { Logger } from '@nestjs/common';
import { Color, ImageAnimationColor } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';

export class ImageCreatorDiagonale extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorDiagonale.name);

  name: string = 'Diagonale';
  width = 15;
  height = 15;
  defaultColors: ImageAnimationColor[] = [
    new ImageAnimationColor('Couleur Fond', new Color(255, 255, 255)),
    new ImageAnimationColor('Couleur Bandes', new Color(0, 0, 255)),
  ];

  // Fonction pour créer une frame en déplaçant le dégradé vers le bas
  createFrame(frameId: number, width: number, height: number, colorBg: Color, colorStripes: Color) {
    const frame = [];
    // on initialise tous avec la couleur de fond
    for (let x = 0; x < height; x++) {
      const line = [];
      for (let y = 0; y < width; y++) {
        line.push(new Color(colorBg.r, colorBg.g, colorBg.b));
      }
      frame.push(line);
    }

    const departs = [];
    for (let i = 0; i < width / 4; i++) {
      departs.push(i);
      departs.push(width / 2 + i);
    }
    departs.forEach((depart) => {
      let x = 0;
      let y = depart + height - frameId;
      for (let i = 0; i < width; i++) {
        x = (x + 1) % width;
        y = (y + 1) % height;
        frame[Math.floor(y)][Math.floor(x)] = new Color(colorStripes.r, colorStripes.g, colorStripes.b);
      }
    });

    return frame;
  }

  // Génère toutes les frames de l'animation
  generateAnimationFrames(width: number, height: number, colors?: Color[]) {
    const colorBg = colors?.[0] ?? this.defaultColors[0].color;
    const colorStripes = colors?.[1] ?? this.defaultColors[1].color;

    const frames = [];

    for (let i = 0; i < height; i++) {
      const frame = this.createFrame(i, width, height, colorBg, colorStripes);
      frames.push(frame);
    }
    return frames;
  }
}
