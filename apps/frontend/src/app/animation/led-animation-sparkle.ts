import { Color, Led, LedAnimOption, LedAnimOptionColor, LedAnimOptionNum, Point } from '@xmas-leds/api-interfaces';
// import { SlowBuffer } from 'buffer';
import { LedAnimationAbstract } from './led-animation-abstract';

export class LedAnimationSparkle extends LedAnimationAbstract {
  tails: Led[][] = [];

  override options: LedAnimOption[] = [
    new LedAnimOptionNum('Duration', 1000, 500, 10000, 'ms'),
    new LedAnimOptionNum('Nb step', 100, 1, 200, ''),
    new LedAnimOptionNum('Nb sparkle', 10, 1, 200, ''),
    new LedAnimOptionNum('Tail size', 15, 1, 50, ''),
    new LedAnimOptionColor('Color Sparkle', new Color(255, 255, 255)),
    new LedAnimOptionColor('Color 1', new Color(59, 30, 9)),
    new LedAnimOptionColor('Color 2', new Color(41, 27, 15)),
    new LedAnimOptionColor('Color 3', new Color(30, 42, 28)),
    new LedAnimOptionColor('Color 4', new Color(30, 20, 30)),
    new LedAnimOptionColor('Color 5', new Color(23, 20, 19)),
  ];

  /**
   * Calculate the animations
   */
  calculateInternal = (points: Point[]) => {
    this.tails = [];
    this.clearFile();
    const duration = this.getOption('Duration') as number;
    const nbStep = this.getOption('Nb step') as number;
    const nbSparkle = this.getOption('Nb sparkle') as number;
    const tailSize = this.getOption('Tail size') as number;
    const colorSparkle = this.getOption('Color Sparkle') as Color;
    const color1 = this.getOption('Color 1') as Color;
    const color2 = this.getOption('Color 2') as Color;
    const color3 = this.getOption('Color 3') as Color;
    const color4 = this.getOption('Color 4') as Color;
    const color5 = this.getOption('Color 5') as Color;

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
          ledsFix.push({ index: sortedIndex, r: color1.r, g: color1.g, b: color1.b });
          break;
        case 1:
          ledsFix.push({ index: sortedIndex, r: color2.r, g: color2.g, b: color2.b });
          break;
        case 2:
          ledsFix.push({ index: sortedIndex, r: color3.r, g: color3.g, b: color3.b });
          break;
        case 3:
          ledsFix.push({ index: sortedIndex, r: color4.r, g: color4.g, b: color4.b });
          break;
        case 4:
          ledsFix.push({ index: sortedIndex, r: color5.r, g: color5.g, b: color5.b });
          break;

        default:
          break;
      }
    }
    for (let index = 0; index < 16; index++) {
      const leds: Led[] = ledsFix.map((l) => {
        return { index: l.index, r: (l.r * index) / 16, g: (l.g * index) / 16, b: (l.b * index) / 16 };
      });
      this.saveLine(100, leds);
    }


    let lastSparkle = -1;
    for (let index = 0; index < nbStep; index++) {
      let leds: Led[] = [...ledsFix];

      const sparkle = Math.floor((index * nbSparkle) / nbStep);
      if (sparkle != lastSparkle) {
        lastSparkle = sparkle;
        const sparkleIndex = Math.floor(Math.random() * points.length);

        leds[sparkleIndex] = { index: sparkleIndex, r: colorSparkle.r, g: colorSparkle.g, b: colorSparkle.b };
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
        const ledFound = ledsOut.findIndex((o) => o.index === l.index);
        const tailColor = new Color(this.calcColor(l.r, tailNum, tailsSize), this.calcColor(l.g, tailNum, tailsSize), this.calcColor(l.b, tailNum, tailsSize));
        // console.log(`${tailNum}/${tailsSize} ${tailColor.r}`);

        if (ledFound < 0) {
          const newLed: Led = { index: l.index, r: tailColor.r, g: tailColor.g, b: tailColor.b };
          // console.log(`${newLed.index} ${newLed.r} `);
          ledsOut.push(newLed);
        } else {
          if (ledsOut[ledFound].r + ledsOut[ledFound].g + ledsOut[ledFound].b < tailColor.r + tailColor.g + tailColor.b) {
            ledsOut[ledFound] = { index: ledsOut[ledFound].index, r: tailColor.r, g: tailColor.g, b: tailColor.b };
          }
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
