import { Injectable, Logger } from '@nestjs/common';
import { Color, ImageAnimation } from '@xmas-leds/api-interfaces';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ImageCreatorAbstract } from './image-creator-abstract';
import { ImageCreatorRainbow } from './image-creator-rainbow';
import { ImageCreatorSnow } from './image-creator-snow';
import { ImageCreatorDiagonale } from './image-creator-diagonale';
import { ImageCreatorHautBas } from './image-creator-haut-bas';
import { ImageCreatorBonbons } from './image-creator-bonbons';
import { ImageCreatorHautBasDouble } from './image-creator-haut-bas-double';

@Injectable()
export class AnimationService {
  readonly logger = new Logger(AnimationService.name);

  constructor() {
    this.initAnimations();
  }

  // method to get filename in the backend from an anim name
  getFileName(name: string, id: number = undefined, type: string = 'csv'): string {
    if (!id) {
      return `data/animations/${name}.${type}`;
    } else {
      return `data/animations/${name}_${('' + id).padStart(4, '0')}.${type}`;
    }
  }

  imagesDir = 'data/images';

  // Méthode pour obtenir toutes les image-animations
  async getAllImageAnimations(): Promise<ImageAnimation[]> {
    mkdirSync(this.imagesDir, { recursive: true });

    const files = readdirSync(this.imagesDir);
    const animations: ImageAnimation[] = [];

    for (const file of files) {
      this.logger.debug(`Lecture de ${file}`);
      const filePath = join(this.imagesDir, file);
      try {
        const data = readFileSync(filePath, 'utf-8');
        const animation = JSON.parse(data) as ImageAnimation;
        // S'assurer que defaultColors existe (pour les anciennes animations)
        const creator = this.imageCreators.find((c) => c.name === animation.name);
        if (creator) {
          animation.defaultColors = creator.defaultColors;
        }
        animations.push(animation);
      } catch (error) {
        this.logger.error(`Erreur lors de la lecture de ${file}:`, error);
      }
    }

    return animations;
  }

  readonly imageCreators: ImageCreatorAbstract[] = [
    new ImageCreatorBonbons(),
    new ImageCreatorHautBas(),
    new ImageCreatorHautBasDouble(),
    new ImageCreatorDiagonale(),
    new ImageCreatorRainbow(),
    new ImageCreatorSnow(),
  ];

  async initAnimations() {
    this.logger.log('Initialisation des animations...');
    const images = await this.getAllImageAnimations();

    for (const imageCreator of this.imageCreators) {
      if (!images.find((image) => image.name === imageCreator.name)) {
        const animation = imageCreator.create();
        this.saveAnimationToFile(animation);
      }
    }
  }

  saveAnimationToFile(animation: ImageAnimation) {
    // Sauvegarde l'animation dans un fichier JSON
    const outputPath = join(this.imagesDir, `${animation.name}.json`);
    writeFileSync(outputPath, JSON.stringify(animation, null, 2));
  }

  // Génère une animation avec des couleurs personnalisées
  generateImageWithColors(imageName: string, colors: Color[]): ImageAnimation | null {
    const creator = this.imageCreators.find((c) => c.name === imageName);
    if (!creator) {
      this.logger.error(`Image creator not found: ${imageName}`);
      return null;
    }
    return creator.create(colors);
  }
}
