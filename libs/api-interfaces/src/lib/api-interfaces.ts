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
  ledCount = 100;
  dontSaveCsvToBackend = false;
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
export class Line {
  duration = 0;
  leds: Led[] = [];
}

export class LedsStatus {
  up?: number;
  heapSize?: number;
  heapFree?: number;
  heapMin?: number;
  heapMax?: number;
  totalBytes?: number;
  usedBytes?: number;
  animOn = true;
}

export interface LedAnimation {
  titre : string;
  existOnBackend:boolean;
  existOnTree:boolean;
  lines: Line[];

  calculate : ((points: Point[]) => void) | undefined;
  sendAnimToTree():void;
  saveFileToBackend():void;
  deleteFileFromBackend():void
  pushToTree():void;
  deleteFromTree():void
  execOnTree():void;
}

export class Notif {
  level: NotifLevel = NotifLevel.OK;
  msg = '';
  id: number;

  constructor(level: NotifLevel, msg:string) {
    this.level = level;
    this.msg  = msg;
    this.id = Math.random();
  }
}

export enum NotifLevel {
  OK,
  WARN,
  ERROR,
}
