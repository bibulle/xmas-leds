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
  private points: Point[] = [];

  constructor(
    private captureService: CaptureService,
    private ledsService: LedsService,
    private configService: ConfigService,
    private pointsService: PointsService,
    private notificationService: NotificationService
  ) {}

  async resetAnalyse() {
    this.avancementTrigger.next(new Advancement());
  }
  async nextStepAnalyse() {
    this.ledsService.toggleStartAnims(false);
    // let stillRunning = true;
    const angle = this.avancementTrigger.value.angle;
    const status = this.avancementTrigger.value.status;

    // We were waiting for next angle
    if (status === Status.WAITING) {
      this.avancementTrigger.next(new Advancement(Status.GETTING_LED, angle, 0));

      // manage all leds for this angle
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

      // if something go wrong
      if (this.rois[angle / 90].length !== this.configService.getLedCount()) {
        console.error('Error on reading leds !!!');
        // erreur
        return;
      }

      // if we haven't finished angles, go to next one
      if (angle !== 270) {
        // Switch to another angle
        return this.avancementTrigger.next(new Advancement(Status.WAITING, (angle + 90) % 360));
      }

      // we have finished all angles, start point calculations
      // console.log(this.rois);

      this.avancementTrigger.next(new Advancement(Status.CALCULATING, 0));

      this.points = await this.calculatePoints();

      // test if unknown points
      this.points.forEach(async (p, index) => {
        // console.log(p);
        if (Number.isNaN(p.x) || Number.isNaN(p.y) || Number.isNaN(p.z)) {
          console.log(`${index} : ${p.x}, ${p.y}, ${p.z}`);
          await this.ledsService.switchOnALed(index);
        }
      });

      // calculate hight for constante volume
      const nbHight = 5;
      const hights: number[] = [];
      const maxZ = this.points.reduce((m, p) => Number.isNaN(p.z) ? m : m > p.z ? m : p.z, -Infinity);

      for (let cpt = 0; cpt <= nbHight; cpt++) {
        const h = maxZ * (1-Math.pow(cpt/nbHight, 1/3));
        hights.push(h);       
      }
      const distribution = this.points.reduce((dist, p) => {
        for (let i = 0; i < nbHight; i++) {
          if (hights[i]>=p.z && p.z>=hights[i+1]) {
            dist[i] = +dist[i]+1
          }
        }
        return dist;
      }, [0,0,0,0,0]);

      console.log(maxZ);
      console.log(hights);
      console.log(distribution);


      this.avancementTrigger.next(new Advancement(Status.WAIT_FOR_SAVE, 0));
    } else if (status === Status.WAIT_FOR_SAVE) {
      // start saving points
      this.avancementTrigger.next(new Advancement(Status.SAVING, 0));
      await this.savePoints(this.points);
      return this.avancementTrigger.next(new Advancement(Status.WAITING, 0));

    }
  }

  /**
   * Capture and calculate ROIs for a new led
   * @param angle
   * @param led
   * @param url
   * @returns
   */
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

  /**
   * We receive a new image... manage it
   * @param angle
   * @param led
   * @param url
   * @returns
   */
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

  /**
   * Get ROIs from an image (by Url)
   * @param url
   * @returns
   */
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

          // Adaptive detection: try different threshold/minSurface combinations
          const thresholds = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35];
          const minSurfaces = [8, 6, 5, 4, 3, 2, 1];

          let myRois: MyRoi[] = [];
          let bestThreshold = 0;
          let bestMinSurface = 0;

          // Try to find exactly one LED with progressively relaxed parameters
          for (const threshold of thresholds) {
            for (const minSurface of minSurfaces) {
              const mask = grey.mask({
                threshold: threshold,
                useAlpha: true,
              });

              const manager: any = grey.getRoiManager();
              manager.fromMask(mask);
              const rois: any[] = manager['getRois']({
                positive: true,
                negative: false,
                minSurface: minSurface,
              });

              // Calculate ROI properties
              const candidateRois: MyRoi[] = rois
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

                  return new MyRoi(roi, img, max, maxSurface);
                })
                .sort((r1, r2) => {
                  if (r1.maxLight != r2.maxLight) {
                    return r2.maxLight - r1.maxLight;
                  } else {
                    return r2.maxSurface - r1.maxSurface;
                  }
                });

              // Strategy: prefer finding exactly 1 ROI, but accept the brightest if we find multiple
              if (candidateRois.length === 1) {
                myRois = candidateRois;
                bestThreshold = threshold;
                bestMinSurface = minSurface;
                break;
              } else if (candidateRois.length > 1 && myRois.length === 0) {
                // Keep this as fallback, but keep looking for exactly 1
                myRois = candidateRois;
                bestThreshold = threshold;
                bestMinSurface = minSurface;
              }
            }
            if (myRois.length === 1) break; // Found exactly one, stop searching
          }

          // If we found multiple ROIs, take only the brightest one
          if (myRois.length > 1) {
            myRois = [myRois[0]];
          }

          // Draw the selected ROI(s) on the image
          const roiImg: Image[] = [];
          myRois.forEach((myRoi) => {
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

  /**
   * Calculates the points from the rois
   */
  async calculatePoints(): Promise<Point[]> {
    return new Promise<Point[]>((resolve) => {
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
        m.x = Number.isNaN(p.x) ? m.x : m.x > p.x ? m.x : p.x;
        m.y = Number.isNaN(p.y) ? m.y : m.y > p.y ? m.y : p.y;
        m.z = Number.isNaN(p.z) ? m.z : m.z > p.z ? m.z : p.z;
        return m;
      }, new Point(-Infinity, -Infinity, -Infinity));
      const min = points.reduce((m, p) => {
        m.x = Number.isNaN(p.x) ? m.x : m.x < p.x ? m.x : p.x;
        m.y = Number.isNaN(p.y) ? m.y : m.y < p.y ? m.y : p.y;
        m.z = Number.isNaN(p.z) ? m.z : m.z < p.z ? m.z : p.z;
        return m;
      }, new Point(Infinity, Infinity, Infinity));
      // console.log(JSON.stringify(points, null, 2));
      // console.log(max);
      // console.log(min);
      const ratio = 2 / Math.max(max.x - min.x, max.y - min.y);
      points.forEach((p) => {
        p.x = (p.x - (max.x + min.x) / 2) * ratio;
        p.y = (p.y - (max.y + min.y) / 2) * ratio;
        p.z = (p.z - min.z) * ratio;
      });
      console.log(points);

      resolve(points);
    });
  }

  /**
   * Save the points to backend
   */
  async savePoints(points: Point[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.configService.isDontSaveCsvToBackend()) {
        this.pointsService
          .sendPointsToBackend(points)
          .then((s) => {
            console.log(s);
            resolve();
          })
          .catch((reason) => {
            this.notificationService.launchNotif_ERROR(reason);
            console.error(reason);
            reject(reason);
          });
      } else {
        this.notificationService.launchNotif_WARN('Conf say... do not save to backends');
        resolve();
      }
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
