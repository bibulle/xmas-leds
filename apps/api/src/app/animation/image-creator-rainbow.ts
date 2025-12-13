import { Color, ImageAnimationColor } from '@xmas-leds/api-interfaces';
import { ImageCreatorAbstract } from './image-creator-abstract';
import { Logger } from '@nestjs/common';

export class ImageCreatorRainbow extends ImageCreatorAbstract {
  readonly logger = new Logger(ImageCreatorRainbow.name);

  name: string = 'Arc-en-Ciel';
    width = 15;
    height = 15;
  // L'arc-en-ciel n'a pas de couleurs personnalisables (généré mathématiquement)
  defaultColors: ImageAnimationColor[] = [];

  // Fonction pour générer une couleur RGB en fonction de la position dans l'arc-en-ciel
  rainbowColor(position: number, maxPosition: number) {
    const frequency = (2 * Math.PI) / maxPosition;
    const red = Math.round(Math.sin(frequency * position) * 127 + 128);
    const green = Math.round(Math.sin(frequency * position + (2 * Math.PI) / 3) * 127 + 128);
    const blue = Math.round(Math.sin(frequency * position + (4 * Math.PI) / 3) * 127 + 128);
    return { r: red, g: green, b: blue };
  }

  // Génère le dégradé de l'arc-en-ciel pour une frame
  generateRainbowGradient(height: number) {
    const gradient = [];
    for (let y = 0; y < height; y++) {
      const color = this.rainbowColor(y, height);
      gradient.push(color);
    }
    return gradient;
  }

  // Fonction pour créer une frame en déplaçant le dégradé vers le bas
  createFrame(gradient: Color[], offset: number, width: number, height: number) {
    const frame = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      // Utilise l'offset pour décaler le gradient verticalement
      for (let x = 0; x < width; x++) {
        const colorIndex = (height - y + offset) % height;
        row.push(gradient[colorIndex]);
      }
      frame.push(row);
    }
    return frame;
  }

  // Génère toutes les frames de l'animation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateAnimationFrames(width: number, height: number, colors?: Color[]) {
    const frames = [];
    const gradient = this.generateRainbowGradient(height);

    for (let i = 0; i < height; i++) {
      const frame = this.createFrame(gradient, i, width, height);
      frames.push(frame);
    }
    return frames;
  }
} 