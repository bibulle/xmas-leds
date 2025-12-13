import { Logger } from '@nestjs/common';
import { Color, ImageAnimationColor } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';

export class ImageCreatorBonbons extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorBonbons.name);

  name: string = 'Bonbons';
  width = 15;
  height = 15;
  defaultColors: ImageAnimationColor[] = [
    new ImageAnimationColor('Couleur Fond', new Color(255, 255, 255)),
    new ImageAnimationColor('Couleur Bord', new Color(0, 0, 0)),
    new ImageAnimationColor('Couleur Centre', new Color(255, 0, 0)),
  ];

  // Fonction pour créer une frame en déplaçant le dégradé vers le bas
  createFrame(frameId: number, width: number, height: number, colorBg: Color, colorBorder: Color, colorCenter: Color) {
    const frame = [];
    // on initialise tous avec la couleur de fond
    for (let x = 0; x < height; x++) {
      const line = [];
      for (let y = 0; y < width; y++) {
        line.push(new Color(colorBg.r, colorBg.g, colorBg.b));
      }
      frame.push(line);
    }

    // On fait les bandes de bordure
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
        frame[Math.floor(y)][Math.floor(x)] = new Color(colorBorder.r, colorBorder.g, colorBorder.b);
      }
    });

    // On fait les bandes centrales
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
        frame[Math.floor(y)][Math.floor(x)] = new Color(colorCenter.r, colorCenter.g, colorCenter.b);
      }
    });
    return frame;
  }

  // Génère toutes les frames de l'animation
  generateAnimationFrames(width: number, height: number, colors?: Color[]) {
    const colorBg = colors?.[0] ?? this.defaultColors[0].color;
    const colorBorder = colors?.[1] ?? this.defaultColors[1].color;
    const colorCenter = colors?.[2] ?? this.defaultColors[2].color;

    const frames = [];

    for (let i = 0; i < height; i++) {
      const frame = this.createFrame(i, width, height, colorBg, colorBorder, colorCenter);
      frames.push(frame);
    }
    return frames;
  }
}
