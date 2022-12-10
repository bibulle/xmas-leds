import { Led, Point } from '@xmas-leds/api-interfaces';
import { LedAnimationAbstract } from './led-animation-abstract';

export class LedAnimationSparkle extends LedAnimationAbstract {
  tails: Led[][] = [];

  /**
   * Calculate the animations
   */
  calculate = (points: Point[]) => {
    this.tails = [];
    this.clearFile();
    const duration = 10000;
    const nbStep = 100;
    const nbSparkle = 20;
    const tailSize = 20;
    const color = [255, 255, 255];

    const sortedPoints = points
      .map((p, i) => {
        return { i: i, p: p };
      })
      .sort((o1, o2) => o1.p.z - o2.p.z)
      .map((o) => o.i);
    const ledsFix: Led[] = [];
    for (let index = 0; index < sortedPoints.length; index++) {
      const sortedIndex = sortedPoints[index];
      switch (sortedIndex % 5) {
        case 0:
          ledsFix.push({ index: sortedIndex, r: 128, g: 0, b: 0 });
          break;
        case 1:
          ledsFix.push({ index: sortedIndex, r: 0, g: 128, b: 0 });
          break;
        case 2:
          ledsFix.push({ index: sortedIndex, r: 0, g: 0, b: 128 });
          break;

        default:
          break;
      }
    }
    for (let index = 0; index < 16; index++) {
      const leds: Led[] = ledsFix.map(l => {return {index:l.index, r:l.r*index/16, g:l.g*index/16, b:l.b*index/16}});
      this.saveLine(100, leds);
    }

    let lastSparkle = -1;
    for (let index = 0; index < nbStep; index++) {
      let leds: Led[] = [...ledsFix];

      const sparkle = Math.floor((index * nbSparkle) / nbStep);
      if (sparkle != lastSparkle) {
        lastSparkle = sparkle;
        const sparkleIndex = Math.floor(Math.random() * points.length);
        leds.push({ index: sparkleIndex, r: color[0], g: color[0], b: color[0] });
      }
      leds = this.manageTail(leds, tailSize);
      this.saveLine(duration / nbStep, leds);
    }

    for (let index = 0; index < tailSize; index++) {
      this.saveLine(duration / nbStep, this.manageTail([], tailSize));
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

    let ratio = (tailsSize - tailNum) / tailsSize;
    ratio = Math.pow(ratio, 10);
    return colorInit * ratio;
  }
}
