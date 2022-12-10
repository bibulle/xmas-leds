import { Led, Point } from '@xmas-leds/api-interfaces';
import { LedAnimationAbstract } from './led-animation-abstract';

export class LedAnimationVertical extends LedAnimationAbstract {
  tails: Led[][] = [];

  /**
   * Calculate the animations
   */
  calculate = (points: Point[]) => {
    this.tails = [];
    this.clearFile();
    const duration = 2000;
    const numberOfStepsVert = 10;
    const numberOfStepsRota = 100;
    const rotationTotal = 720;
    const tailSize = 20;
    const color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];

    const maxZ = points.reduce((p, c) => (p > c.z ? p : c.z), -Infinity);

    const sortedPoints: { index: number; angle: number }[][] = [...Array(numberOfStepsVert).keys()].map(() => []);

    points.forEach((p, index) => {
      const percentZ = Math.min(Math.floor((numberOfStepsVert * p.z) / maxZ), numberOfStepsVert - 1);
      const angle = 180 + (Math.atan2(p.y, p.x) * 180.0) / Math.PI;
      sortedPoints[percentZ].push({ index: index, angle: angle });
    });
    // console.log(sortedPoints)

    for (let step = 0; step < numberOfStepsRota + tailSize + 3; step++) {
      let leds: Led[] = [];
      const stepVert = Math.floor((step * numberOfStepsVert) / numberOfStepsRota);
      // console.log(`${stepVert} ${numberOfStepsVert} ${sortedPoints.length}`);
      for (let i = 0; stepVert < sortedPoints.length && i < sortedPoints[stepVert].length; i++) {
        if ((sortedPoints[stepVert][i].angle + (step * rotationTotal) / numberOfStepsRota) % 360 > 180) {
          leds.push({ index: sortedPoints[stepVert][i].index, r: color[0], g: color[1], b: color[2] });
        }
      }

      leds = this.manageTail(leds, tailSize);
      this.saveLine(duration / numberOfStepsRota, leds);
    }

    this.visuByLine();
    // console.log(this.lines);
  };

  manageTail(leds: Led[], tailsSize: number): Led[] {
    const ledsOut = [...leds];
    this.tails.push(leds);

    for (let i = this.tails.length - 2; i >= 0; i--) {
      const tailNum = this.tails.length - 1 - i;
      const ledsTail = this.tails[i];
      ledsTail.forEach((l) => {
        if (!ledsOut.find((o) => o.index === l.index)) {
          const newLed: Led = { index: l.index, r: this.calcColor(l.r, tailNum, tailsSize), g: this.calcColor(l.g, tailNum, tailsSize), b: this.calcColor(l.b, tailNum, tailsSize) };
          // console.log(`${newLed.index} ${newLed.r} `);
          ledsOut.push(newLed);
        }
      });
    }

    this.tails = this.tails.slice(-tailsSize - 2);

    return ledsOut;
  }

  calcColor(colorInit: number, tailNum: number, tailsSize: number): number {
    // console.log(`calcColor(${colorInit}, ${tailNum}, ${tailsSize} => ${colorInit * (tailsSize-tailNum)/tailsSize} `);
    if (tailNum > tailsSize) {
      tailNum = tailsSize;
    }
    return (colorInit * (tailsSize - tailNum)) / tailsSize;
  }
}
