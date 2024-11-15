import { Injectable, Logger } from '@nestjs/common';
import { ImageAnimation } from '@xmas-leds/api-interfaces';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ImageCreatorAbstract } from './image-creator-abstract';
import { ImageCreatorRainbow } from './image-creator-rainbow';
import { ImageCreatorSnow } from './image-creator-snow';
import { ImageCreatorDiagonale } from './image-creator-diagonale';
import { ImageCreatorHautBas } from './image-creator-haut-bas';
import { ImageCreatorBonbons } from './image-creator-bonbons';

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

  animationsDir = 'data/images';

  // Méthode pour obtenir toutes les image-animations
  async getAllImageAnimations(): Promise<ImageAnimation[]> {
    const files = await readdirSync(this.animationsDir);
    const animations = [];

    for (const file of files) {
      this.logger.debug(`Lecture de ${file}`);
      const filePath = join(this.animationsDir, file);
      try {
        const data = await readFileSync(filePath, 'utf-8');
        const animation = JSON.parse(data);
        animations.push(animation);
      } catch (error) {
        this.logger.error(`Erreur lors de la lecture de ${file}:`, error);
      }
    }

    return animations;
  }

  readonly imageCreators:ImageCreatorAbstract[] = [ new ImageCreatorBonbons(), new ImageCreatorHautBas(), new ImageCreatorDiagonale(), new ImageCreatorRainbow(), new ImageCreatorSnow ];

  async initAnimations() {
    this.logger.log('Initialisation des animations...');
    const images = await this.getAllImageAnimations();

    for (const imageCreator of this.imageCreators) {
      //if (!images.find( (image) => image.name === imageCreator.name)) {
        const animation = await imageCreator.create();
        this.saveAnimationToFile(animation);
      //}
    }
  }

  saveAnimationToFile(animation: ImageAnimation) {
    // Sauvegarde l'animation dans un fichier JSON
    const outputPath = join(this.animationsDir, `${animation.name}.json`);
    writeFileSync(outputPath, JSON.stringify(animation, null, 2));
  }

}
