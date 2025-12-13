/* eslint-disable @typescript-eslint/no-explicit-any */
import { Image } from 'image-js';

/**
 * API content
 */
export class ApiReturn {
  ok?: string;
  points?: Point[];
  status?: LedsStatus;
  animations?: string[];
  anim?: LedAnimation;
  images?: ImageAnimation[];
  program?: LedProgram;
  // id_token?: string;
  // version?: Version;
  // user?: UserAPI;
  // users?: UserAPI[];
  // books?: Book[];
  // tags?: Tag[];
  // series?: Series[];
  // authors?: Author[];
  // book?: Book;
  // refreshToken?: string;
  // newPassword?: string;
  // status?: Status;
}

export class Advancement {
  status = Status.WAITING;
  angle: number;
  led?: number;

  constructor(status = Status.WAITING, angle = 0, led: number | undefined = undefined) {
    this.status = status;
    this.angle = angle;
    this.led = led;
  }
}

export enum Status {
  WAITING,
  GETTING_LED,
  CALCULATING,
  WAIT_FOR_SAVE,
  SAVING,
}

export class MyRoi {
  roi: any;
  img!: Image;
  maxLight = 0;
  maxSurface = 0;
  x: number;
  y: number;

  constructor(roi: any, img: Image, maxLight: number, maxSurface: number) {
    this.roi = roi;
    this.img = img;
    this.maxLight = maxLight;
    this.maxSurface = maxSurface;
    this.x = roi.meanX;
    this.y = roi.meanY;
  }
}

export class Config {
  loadCaptureFromDisk = false;
  dontUseLed = false;
  waitBetweenLeds = false;
  ledCount = 200;
  dontSaveCsvToBackend = false;
  useBaseFile = false;
}

export class Point {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Led {
  index = 0;
  r = 0;
  g = 0;
  b = 0;
}
export class Color {
  r: number;
  g: number;
  b: number;

  constructor(r = Math.floor(Math.random() * 256), g = Math.floor(Math.random() * 256), b = Math.floor(Math.random() * 256)) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  static merge(c1: Color, c2: Color) {
    return Color.interpolate(c1, c2, 0.5);
  }

  static interpolate(c1: Color, c2: Color, t: number): Color {
    return new Color(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
  }

  static toString(c: Color): string {
    return `rgb(${c.r}, ${c.g}, ${c.b})`;
    // return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
  }
  static fromString(s: string): Color {
    const re1 = /^rgb[(] *([0-9]+) *, *([0-9]+) *, *([0-9]+) *[)]$/i;
    const re2 = /^#([A-F0-9][A-F0-9])([A-F0-9][A-F0-9])([A-F0-9][A-F0-9])$/i;
    const match1 = s.match(re1);
    const match2 = s.match(re2);
    if (match1?.length === 4) {
      return new Color(+match1[1], +match1[2], +match1[3]);
    } else if (match2?.length === 4) {
      return new Color(parseInt(match2[1], 16), parseInt(match2[2], 16), parseInt(match2[3], 16));
    }

    console.log(`Unknown color format '${s}'`);
    return new Color(0, 0, 0);
  }
}
export class Line {
  duration = 0;
  leds: Led[] = [];
}

export class LedsStatus {
  defined = true;
  up?: number;
  heapSize?: number;
  heapFree?: number;
  heapMin?: number;
  heapMax?: number;
  totalBytes?: number;
  usedBytes?: number;
  animOn? = true;
}

export class savedAnimation {}

export interface LedAnimation {
  titre: string;
  existOnBackend: boolean;
  existOnTree: boolean;
  lines: Line[];

  options: LedAnimOption[];
  // optionsSummary?: {name:string, valueN:number, valueS:string}[];

  calculate?(points: Point[]): void;
  calculateInternal?(points: Point[]): void;
  initOptions?(): void;
  optionsChanged?(): boolean;
  mimicToTree?(): void;
  saveFileToBackend?(): void;
  deleteFileFromBackend?(): void;
  visuFromBackend?(): void;
  // pushToTree?(): void;
  // deleteFromTree?(): void;
  // execOnTree?(): void;
}

export class ImageAnimationColor {
  name = '';
  color: Color = new Color(0, 0, 0);

  constructor(name: string, color: Color) {
    this.name = name;
    this.color = color;
  }
}

export class ImageAnimation {
  name = '';
  frames: Color[][][] = [];
  defaultColors: ImageAnimationColor[] = [];
}

export abstract class LedAnimOption {
  name = 'foo';
  abstract type: LedAnimOptionType;
  valueN?: number;
  valueS?: string;
  valueI?: ImageAnimation;

  min?: number;
  max?: number;
  unit?: string;
}

export class LedAnimOptionNum extends LedAnimOption {
  type = LedAnimOptionType.NUMBER;
  override valueN = 0;

  constructor(name: string, defaultValue: number, min: number, max: number, unit: string) {
    super();
    this.valueN = defaultValue;
    this.name = name;
    this.min = min;
    this.max = max;
    this.unit = unit;
  }
}

export class LedAnimOptionColor extends LedAnimOption {
  type = LedAnimOptionType.COLOR;
  override valueS = '';

  constructor(name: string, defaultColor: Color) {
    super();
    this.name = name;
    this.valueS = Color.toString(defaultColor);
  }
}

export class LedAnimOptionImage extends LedAnimOption {
  type = LedAnimOptionType.IMAGE;
  override valueS = '';

  constructor(name: string, defaultImage?: ImageAnimation) {
    super();
    this.name = name;

    this.valueI = defaultImage;
  }
}

export class LedAnimOptionEmpty extends LedAnimOption {
  type = LedAnimOptionType.EMPTY;

  constructor() {
    super();
    // this.name = name;
  }
}

export class LedProgram {
  repeat: { [id: string]: number } = {};
  anims: string[] = [];
}

export class Notif {
  level: NotifLevel = NotifLevel.OK;
  msg = '';
  id: number;

  constructor(level: NotifLevel, msg: string) {
    this.level = level;
    this.msg = msg;
    this.id = Math.random();
  }
}

export enum NotifLevel {
  OK,
  WARN,
  ERROR,
}
export enum LedAnimOptionType {
  NUMBER,
  COLOR,
  EMPTY,
  IMAGE,
}
