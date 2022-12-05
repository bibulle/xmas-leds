import { Point } from '@xmas-leds/api-interfaces';
import { LedAnimationAbstract } from './led-animation-abstract';

export class LedAnimationVertical extends LedAnimationAbstract {
  /**
   * Calculate the animations
   */
  calculate = (points: Point[]) => {
    this.clearFile();
    const duration = 1000;
    const numberOfSteps = 20;
    const tailSize = 5;

    const maxZ = points.reduce((p, c) => (p > c.z ? p : c.z), -Infinity);

    const sortedPoints: number[][] = [...Array(numberOfSteps).keys()].map(() => []);

    points.forEach((p, index) => {
      const percentZ = Math.min(Math.floor((numberOfSteps * p.z) / maxZ), numberOfSteps - 1);
      sortedPoints[percentZ].push(index);
    });
    // console.log(sortedPoints)

    let stepNum = 0;
    const interval = setInterval(() => {
      for (let i = 0; i < tailSize + 1; i++) {
        const j = stepNum - i;
        if (numberOfSteps > j && j >= 0) {
          for (let index = 0; index < sortedPoints[j].length; index++) {
            this.setLedColor(sortedPoints[j][index], 255 - (i * 255) / tailSize, 255 - (i * 255) / tailSize, 0);
          }
        }
      }
      this.saveLine(duration / numberOfSteps);
      stepNum++;
      if (stepNum > numberOfSteps + tailSize) {
        clearInterval(interval);
        // this.saveFile(anim);
      }
    }, duration / numberOfSteps);
  };
}
