import { Color, Led, LedAnimOption, LedAnimOptionColor, LedAnimOptionNum, LedAnimOptionEmpty, Point } from '@xmas-leds/api-interfaces';
import * as THREE from 'three';
import { LedAnimationAbstract } from './led-animation-abstract';

export class LedAnimationVertical extends LedAnimationAbstract {
  tails: Led[][] = [];

  override options: LedAnimOption[] = [
    new LedAnimOptionNum('Duration', 1000, 500, 10000, 'ms'),
    new LedAnimOptionEmpty(),
    new LedAnimOptionNum('Nb step vert', 10, 1, 30, ''),
    new LedAnimOptionNum('Nb step rota', 100, 1, 200, ''),
    new LedAnimOptionNum('Rotation tot', 1800, 9, 3600, '°'),
    new LedAnimOptionNum('Tail size', 20, 1, 50, ''),
    new LedAnimOptionColor('Color 1 bas', new Color(255, 0, 0)),
    new LedAnimOptionColor('Color 2 bas', new Color(255, 0, 0)),
    new LedAnimOptionColor('Color 1 haut', new Color(0, 255, 0)),
    new LedAnimOptionColor('Color 2 haut', new Color(0, 255, 0)),
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
    const numberOfStepsVert = this.getOption('Nb step vert') as number;
    const numberOfStepsRota = this.getOption('Nb step rota') as number;
    const rotationTotal = this.getOption('Rotation tot') as number;
    const tailSize = this.getOption('Tail size') as number;
    const color1bas = this.getOption('Color 1 bas') as Color;
    const color2bas = this.getOption('Color 2 bas') as Color;
    const color1haut = this.getOption('Color 1 haut') as Color;
    const color2haut = this.getOption('Color 2 haut') as Color;
    const angle1 = this.getOption('Angle X') as number;
    const angle2 = this.getOption('Angle Y') as number;
    const angle3 = this.getOption('Angle Z') as number;

    console.log(`${angle1} ${angle2} ${angle3}`);
    

    // rotation
    const mat = new THREE.Euler((angle1 * Math.PI) / 180, (angle2 * Math.PI) / 180, (angle3 * Math.PI) / 180, 'XYZ');
    console.log(mat);
    
    const points: Point[] = pointsBase.map(p => {
      const v = new THREE.Vector3(p.x, p.y, p.z).applyEuler(mat);
      return new Point(v.x, v.y, v.z);
    });

    // get the size of the tree
    const maxX = points.reduce((p, c) => (p > c.x ? p : c.x), -Infinity);
    const minX = points.reduce((p, c) => (p < c.x ? p : c.x), Infinity);
    const meanX =(minX + maxX)/2;
    const maxY = points.reduce((p, c) => (p > c.y ? p : c.y), -Infinity);
    const minY = points.reduce((p, c) => (p < c.y ? p : c.y), Infinity);
    const meanY =(minY + maxY)/2;
    const maxZ = points.reduce((p, c) => (p > c.z ? p : c.z), -Infinity);
    const minZ = points.reduce((p, c) => (p < c.z ? p : c.z), Infinity);

    // sort the points by angle
    const sortedPoints: { index: number; angle: number }[][] = [...Array(numberOfStepsVert).keys()].map(() => []);

    points.forEach((p, index) => {
      const percentZ = Math.min(Math.floor((numberOfStepsVert * (p.z - minZ)) / (maxZ-minZ)), numberOfStepsVert - 1);
      const angle = 180 + (Math.atan2(p.y-meanY, p.x-meanX) * 180.0) / Math.PI;
      sortedPoints[percentZ].push({ index: index, angle: angle });
    });
    // console.log(sortedPoints)

    for (let step = 0; step < numberOfStepsRota + tailSize + 3; step++) {
      let leds: Led[] = [];
      const stepVert = Math.floor((step * numberOfStepsVert) / numberOfStepsRota);
      // console.log(`${stepVert} ${numberOfStepsVert} ${sortedPoints.length}`);
      for (let i = 0; stepVert < sortedPoints.length && i < sortedPoints[stepVert].length; i++) {
        const angle = Math.abs(((sortedPoints[stepVert][i].angle + (step * rotationTotal) / numberOfStepsRota) % 360) - 180);
        const colorBas = this.calcColor1(color1bas, color2bas, angle / 180);
        // console.log(colorBas);
        const colorHaut = this.calcColor1(color1haut, color2haut, angle / 180);
        // console.log(colorHaut);
        const color = this.calcColor1(colorBas, colorHaut, (numberOfStepsVert - stepVert) / numberOfStepsVert);
        // console.log(angle);
        // if ((sortedPoints[stepVert][i].angle + (step * rotationTotal) / numberOfStepsRota) % 360 > 180) {
        leds.push({ index: sortedPoints[stepVert][i].index, r: color.r, g: color.g, b: color.b });
        // }
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
