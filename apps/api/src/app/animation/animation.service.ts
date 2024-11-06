import { Injectable } from '@nestjs/common';

@Injectable()
export class AnimationService {
    
  // method to get filename in the backend from an anim name
  getFileName(name: string, id: number = undefined, type: string = 'csv'): string {
    if (!id) {
      return `data/animations/${name}.${type}`;
    } else {
      return `data/animations/${name}_${('' + id).padStart(4, '0')}.${type}`;
    }
  }
}
