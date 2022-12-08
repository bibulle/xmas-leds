/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Advancement, MyRoi, Point, Status } from '@xmas-leds/api-interfaces';
import { Image } from 'image-js';
import { BehaviorSubject, concatMap, filter, lastValueFrom, Observable, of, range, Subject, takeUntil, toArray } from 'rxjs';
import { ConfigService } from '../config.service';
import { LedsService } from '../leds/leds.service';
import { NotificationService } from '../notification/notification.service';
import { PointsService } from '../points/points.service';
import { CaptureService } from './capture/capture.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyseService {
  private imageTrigger: Subject<Image> = new Subject<Image>();
  private imageRoisTrigger: Subject<Image[]> = new Subject<Image[]>();
  private avancementTrigger: BehaviorSubject<Advancement> = new BehaviorSubject<Advancement>(new Advancement());

  private imageWidth = NaN;
  private rois: any[][] = [[], [], [], []];

  constructor(
    private captureService: CaptureService, 
    private ledsService: LedsService, 
    private configService: ConfigService, 
    private pointsService: PointsService,
    private notificationService: NotificationService,
    ) {}

  async resetAnalyse() {
    this.avancementTrigger.next(new Advancement());
  }
  async startAnalyse() {
    // let stillRunning = true;
    const angle = this.avancementTrigger.value.angle;

    this.avancementTrigger.next(new Advancement(Status.GETTING_LED, angle, 0));

    this.rois[angle / 90] = await lastValueFrom(
      range(0, this.configService.getLedCount())
        .pipe(
          concatMap((led) => {
            return this.manageNextLed(angle, led).catch(() => {
              this.avancementTrigger.next(new Advancement(Status.WAITING, this.avancementTrigger.value.angle));
            });
          }),
          takeUntil(this.avancementObservableWaiting())
        )
        .pipe(
          concatMap((value) => {
            return of(value);
          }),
          toArray()
        )
    );
    // console.log(this.rois);

    if (this.rois[angle / 90].length !== this.configService.getLedCount()) {
      // erreur
      return;
    } else if (angle !== 270) {
      // Switch to another angle
      this.avancementTrigger.next(new Advancement(Status.WAITING, (angle + 90) % 360));
    } else {
      // start calulating points
      this.avancementTrigger.next(new Advancement(Status.CALCULATING, 0));

      const points = [...Array(this.configService.getLedCount()).keys()].map((i) => {
        const p0 = new Point2DTaille(this.rois[0][i]);
        const p1 = new Point2DTaille(this.rois[1][i]);
        const p2 = new Point2DTaille(this.rois[2][i]);
        const p3 = new Point2DTaille(this.rois[3][i]);

        return new Point(
          this.average(this.imageWidth / 2 - p0.x, p0.taille, p2.x - this.imageWidth / 2, p2.taille),
          this.average(this.imageWidth / 2 - p1.x, p1.taille, p3.x - this.imageWidth / 2, p3.taille),
          this.average(-p0.z, p0.taille, -p1.z, p1.taille, -p2.z, p2.taille, -p3.z, p3.taille)
        );
      });
      // console.log(points);

      // calculate max and min X and Y
      const max = points.reduce((m, p) => {
        m.x = m.x > p.x ? m.x : p.x;
        m.y = m.y > p.y ? m.y : p.y;
        m.z = m.z > p.z ? m.z : p.z;
        return m;
      }, new Point(-Infinity, -Infinity, -Infinity));
      const min = points.reduce((m, p) => {
        m.x = m.x < p.x ? m.x : p.x;
        m.y = m.y < p.y ? m.y : p.y;
        m.z = m.z < p.z ? m.z : p.z;
        return m;
      }, new Point(Infinity, Infinity, Infinity));
      console.log(JSON.stringify(points,null,2));
      console.log(max);
      console.log(min);
      const ratio = 2 / Math.max(max.x - min.x, max.y - min.y);
      points.forEach((p) => {
        p.x = (p.x - (max.x + min.x) / 2) * ratio;
        p.y = (p.y - (max.y + min.y) / 2) * ratio;
        p.z = (p.z - min.z) * ratio;
      });
      console.log(JSON.stringify(points,null,2));

      if (!this.configService.isDontSaveCsvToBackend()) {
        this.pointsService
          .sendPointsToBackend(points)
          .then((s) => {
            console.log(s);
            this.avancementTrigger.next(new Advancement(Status.WAITING, 0));
          })
          .catch((reason) => {
            this.notificationService.launchNotif_ERROR(reason);
            console.error(reason);
          });
      } else {
        this.notificationService.launchNotif_WARN("Conf say... do not save to backends");
        this.avancementTrigger.next(new Advancement(Status.WAITING, 0));
      }
    }
  }

  async manageNextLed(angle: number, led: number): Promise<MyRoi | undefined> {
    return new Promise((resolve, reject) => {
      this.avancementTrigger.next(new Advancement(Status.GETTING_LED, angle, led));

      // switch off all leds
      this.ledsService
        .switchAllOff()
        .then(() => {
          // switch on one led
          this.ledsService.switchOnALed(led).then(() => {
            // capture image
            this.captureService.captureImage(angle, led).then((url) => {
              // calculate roi and position
              this.handleImage(angle, led, url)
                .then((roi) => {
                  if (this.configService.isWaitBetweenLedsEnable()) {
                    setTimeout(() => {
                      resolve(roi);
                    }, 4000);
                  } else {
                    resolve(roi);
                  }
                })
                .catch((reason) => {
                  // console.error(reason);
                  reject(reason);
                });
            });
          });
        })
        .catch((reason) => {
          this.notificationService.launchNotif_ERROR(reason);
          // console.error(reason);
          reject(reason);
        });
    });
  }

  public handleImage(angle: number, led: number, url: string): Promise<MyRoi | undefined> {
    return new Promise<MyRoi | undefined>((resolve, reject) => {
      // image captured...
      // transform to prepare image analyses
      this.getRois(url)
        .then((rois) => {
          if (rois.length === 0) {
            console.log(`${led}\t: No LED found`);
            resolve(undefined);
          } else {
            console.log(`${led}\t: ${rois[0].x}, ${rois[0].y}, ${rois[0].maxLight}, ${rois[0].maxSurface}`);
            resolve(rois[0]);
          }
        })
        .catch((reason) => {
          this.notificationService.launchNotif_ERROR(reason);
          // console.error(reason);
          reject(reason);
        });
    });
  }

  async getRois(url: string): Promise<MyRoi[]> {
    return new Promise<MyRoi[]>((resolve, reject) => {
      Image.load(url)
        .then((image) => {
          this.imageTrigger.next(image);
          this.imageWidth = image.width;

          // move it to grey (to have only one channel)
          const grey = image.grey({
            algorithm: GreyAlgorithm.LIGHTNESS,
          });
          // get the grey mask (only look at bright points)
          const mask = grey.mask({
            // algorithm: ThresholdAlgorithm.RENYI_ENTROPY,
            threshold: 0.9,
            useAlpha: true,
          });
          // get the ROIs (from grey+mask)
          const manager: any = grey.getRoiManager();
          manager.fromMask(mask);
          const rois: any[] = manager['getRois']({
            positive: true,
            negative: false,
            minSurface: 3,
          });
          // console.log('Nombre de ROI : ' + rois.length);

          // calculate value to sort the lighter ROI (max light, surface with at max light)
          const myRois: MyRoi[] = rois
            .map((roi) => {
              const msk = roi.getMask();
              const img: Image = grey.extract(msk);
              const max = img.getMax()[0];

              const h = img.getHistogram({
                maxSlots: 256,
                channel: 0,
                useAlpha: true,
              });
              const maxSurface = h[max] + h[max - 1] + h[max - 2];
              // console.log(`max=${max} count=${maxSurface}`);

              return new MyRoi(roi, img, max, maxSurface);
            })
            .sort((r1, r2) => {
              if (r1.maxLight != r2.maxLight) {
                return r2.maxLight - r1.maxLight;
              } else {
                return r2.maxSurface - r1.maxSurface;
              }
            });
          // console.log(myRois);

          // get the roi with max light and draw them to captured image
          const roiImg: Image[] = [];
          const maxOfMax = myRois[0]?.maxLight;
          myRois
            .filter((myRoi) => {
              return myRoi.maxLight == maxOfMax;
            })
            .forEach((myRoi) => {
              image.paintPolygon([
                [myRoi.roi.minX, myRoi.roi.minY],
                [myRoi.roi.minX, myRoi.roi.maxY],
                [myRoi.roi.maxX, myRoi.roi.maxY],
                [myRoi.roi.maxX, myRoi.roi.minY],
              ]);
              image.paintPoints([[Math.ceil(myRoi.roi.meanX), Math.ceil(myRoi.roi.meanY)]], { color: [0, 0, 0] });

              roiImg.push(myRoi.img);
              this.imageRoisTrigger.next(roiImg);
            });
          this.imageTrigger.next(image);

          resolve(myRois);
        })
        .catch(() => {
          this.notificationService.launchNotif_ERROR(`Cannot load image (${url})`);
          console.error(`Cannot load image (${url})`);
          return reject(`Cannot load image (${url})`);
        });
    });
  }

  average(
    n1: number,
    p1: number,
    n2: number,
    p2: number,
    n3: number | undefined = undefined,
    p3: number | undefined = undefined,
    n4: number | undefined = undefined,
    p4: number | undefined = undefined
  ): number {
    const somme = (p1 ? p1 : 0) + (p2 ? p2 : 0) + (p3 ? p3 : 0) + (p4 ? p4 : 0);
    if (somme === 0) {
      return NaN;
    } else {
      return (n1 * (p1 ? p1 : 0) + n2 * (p2 ? p2 : 0) + (n3 ? n3 : 0) * (p3 ? p3 : 0) + (n4 ? n4 : 0) * (p4 ? p4 : 0)) / somme;
    }
  }

  imageObservable(): Observable<Image> {
    return this.imageTrigger.asObservable();
  }
  imageRoisObservable(): Observable<Image[]> {
    return this.imageRoisTrigger.asObservable();
  }
  avancementObservable(): Observable<Advancement> {
    return this.avancementTrigger.asObservable();
  }
  avancementObservableWaiting(): Observable<Advancement> {
    return this.avancementTrigger.asObservable().pipe(filter((av) => av.status === Status.WAITING));
  }
}

export enum GreyAlgorithm {
  LUMA709 = 'luma709',
  LUMA601 = 'luma601',
  MAXIMUM = 'maximum',
  MINIMUM = 'minimum',
  AVERAGE = 'average',
  MINMAX = 'minmax',
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  CYAN = 'cyan',
  MAGENTA = 'magenta',
  YELLOW = 'yellow',
  BLACK = 'black',
  HUE = 'hue',
  SATURATION = 'saturation',
  LIGHTNESS = 'lightness',
}

export enum ThresholdAlgorithm {
  HUANG = 'huang',
  INTERMODES = 'intermodes',
  ISODATA = 'isodata',
  LI = 'li',
  MAX_ENTROPY = 'maxentropy',
  MEAN = 'mean',
  MIN_ERROR = 'minerror',
  MOMENTS = 'moments',
  OTSU = 'otsu',
  PERCENTILE = 'percentile',
  RENYI_ENTROPY = 'renyientropy',
  SHANBHAG = 'shanbhag',
  TRIANGLE = 'triangle',
  YEN = 'yen',
}

class Point2DTaille {
  x = NaN;
  z = NaN;
  taille = NaN;

  constructor(roi: MyRoi | undefined) {
    this.x = roi ? roi.x : 0;
    this.z = roi ? roi.y : 0;
    this.taille = roi ? roi.maxSurface : 0;
  }
}
