import { Color, ImageAnimation, Led, LedAnimOption, LedAnimOptionEmpty, LedAnimOptionImage, LedAnimOptionNum, Point } from '@xmas-leds/api-interfaces';
import * as THREE from 'three';
import { LedAnimationAbstract } from './led-animation-abstract';

export class LedAnimationImage extends LedAnimationAbstract {
  tails: Led[][] = [];

  override options: LedAnimOption[] = [
    new LedAnimOptionNum('Duration', 1000, 500, 10000, 'ms'),
    new LedAnimOptionEmpty(),
    new LedAnimOptionImage('Image', undefined),
    new LedAnimOptionEmpty(),
    new LedAnimOptionNum('Angle X', 0, 1, 180, '°'),
    new LedAnimOptionNum('Angle Y', 0, 1, 180, '°'),
    new LedAnimOptionNum('Angle Z', 0, 1, 180, '°'),
  ];

  readonly BLACK = new Color(0, 0, 0);

  /**
   * Calculate the animations
   */
  calculateInternal = (pointsBase: Point[]) => {
    this.tails = [];
    this.clearFile();
    const duration = this.getOption('Duration') as number;
    const images = this.getOption('Image') as ImageAnimation;
    const angle1 = this.getOption('Angle X') as number;
    const angle2 = this.getOption('Angle Y') as number;
    const angle3 = this.getOption('Angle Z') as number;

    console.log(`${angle1} ${angle2} ${angle3}`);

    // do the rotation
    const mat = new THREE.Euler((angle1 * Math.PI) / 180, (angle2 * Math.PI) / 180, (angle3 * Math.PI) / 180, 'XYZ');
    console.log(mat);

    const points: Point[] = pointsBase.map((p) => {
      const v = new THREE.Vector3(p.x, p.y, p.z).applyEuler(mat);
      return new Point(v.x, v.y, v.z);
    });

    // get the size of the tree
    const maxX = points.reduce((p, c) => (p > c.x ? p : c.x), -Infinity);
    const minX = points.reduce((p, c) => (p < c.x ? p : c.x), Infinity);
    const meanX = (minX + maxX) / 2;
    const maxY = points.reduce((p, c) => (p > c.y ? p : c.y), -Infinity);
    const minY = points.reduce((p, c) => (p < c.y ? p : c.y), Infinity);
    const meanY = (minY + maxY) / 2;
    const maxZ = points.reduce((p, c) => (p > c.z ? p : c.z), -Infinity);
    const minZ = points.reduce((p, c) => (p < c.z ? p : c.z), Infinity);

    // calculate each step
    const stepDuration = duration / images.frames.length;

    // let's go
    for (let step = 0; step < images.frames.length; step++) {
      const frame = images.frames[step];
      const leds: Led[] = [];

      points.forEach((p, index) => {
        // witch height ?
        const percentZ = (p.z - minZ) / (maxZ - minZ);
        const z = Math.min(Math.floor(percentZ * frame[0].length), frame[0].length - 1);

        // witch width  ?
        const angle = 180 + (Math.atan2(p.y - meanY, p.x - meanX) * 180.0) / Math.PI;
        const x = Math.floor(((angle % 180) / 180) * frame.length);

        const color = frame[z][x];
        console.log(`${index} ${x} ${z} ${color}`);
        leds.push({ index: index, r: color.r, g: color.g, b: color.b });
      });
      this.saveLine(stepDuration, leds);
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
          const color = this.calcColor1(l, this.BLACK, (tailsSize - tailNum) / tailsSize);
          const newLed: Led = { index: l.index, r: color.r, g: color.g, b: color.b };
          // console.log(`${newLed.index} ${newLed.r} `);
          ledsOut.push(newLed);
        }
      });
    }

    this.tails = this.tails.slice(-tailsSize - 2);

    return ledsOut;
  }

  calcColor(colorInit: number, tailNum: number, tailsSize: number): number {
    console.log(`calcColor(${colorInit}, ${tailNum}, ${tailsSize} => ${(colorInit * (tailsSize - tailNum)) / tailsSize} `);
    if (tailNum > tailsSize) {
      tailNum = tailsSize;
    }
    return (colorInit * (tailsSize - tailNum)) / tailsSize;
  }

  calcColor1(color1: Color | Led, color2: Color, ratio: number): Color {
    if (color1 instanceof Led) {
      color1 = new Color(color1.r, color1.g, color1.b);
    }
    const color = new Color(Math.round(color1.r * ratio + color2.r * (1 - ratio)), Math.round(color1.g * ratio + color2.g * (1 - ratio)), Math.round(color1.b * ratio + color2.b * (1 - ratio)));
    return { r: Math.max(0, color.r), g: Math.max(0, color.g), b: Math.max(0, color.b) };
  }
}
