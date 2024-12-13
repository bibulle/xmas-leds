import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, ImageAnimation, Led, LedAnimation, LedAnimOptionImage, LedProgram, Line } from '@xmas-leds/api-interfaces';
import { lastValueFrom, map, Subject } from 'rxjs';
import { ConfigService } from '../config.service';
import { LedsService } from '../leds/leds.service';
import { NotificationService } from '../notification/notification.service';
import { LedAnimationVertical } from './led-animation-vertical';
import { LedAnimationSparkle } from './led-animation-sparkle';
import { LedAnimationImage } from './led-animation-image';

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  constructor(private ledsService: LedsService, private httpClient: HttpClient, private configService: ConfigService, private notificationService: NotificationService) {}

  changingColor: Subject<Led> = new Subject();
  animationsListNeedRefresh: Subject<boolean> = new Subject();

  async mimicToTree(lines: Line[]) {
    let start = Date.now();

    let index = 0;
    for await (const l of lines) {
      await this.ledsService.changeSomeLeds(l.leds);

      const millis = Date.now() - start;
      console.log(`${index} done  ${millis} ${millis / (l.leds.length == 0 ? 1 : l.leds.length)}`);
      start = Date.now();
      index++;
    }
  }

  async visuFromBackend(anim: LedAnimation) {
    return new Promise<string>((resolve, reject) => {
      // create body with only useful attribut

      this.httpClient.get<ApiReturn>(`/api/anim/${encodeURIComponent(anim.titre)}`, {}).subscribe({
        next: async (data) => {
          // console.log(data);
          if (data && data.anim) {
            await this.visuByLine(data.anim.lines);
            resolve('done');
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR(`Cannot get anim from backend`);
            reject('Cannot get anim from backend');
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }

  async loadImageAnimations(): Promise<ImageAnimation[] | undefined> {
    const animations = lastValueFrom(
      this.httpClient.get<ApiReturn>(`/api/anim/images`, {}).pipe(
        map((data) => {
          return data?.images;
        })
      )
    );
    return animations;
  }

  async visuByLine(lines: Line[], divisor = 1): Promise<void> {
    console.log(`visuByLine : ./${lines.length}`);
    return new Promise<void>((resolve) => {
      this.visuByLineIndex(lines, 0, divisor, resolve);
    });
  }
  visuByLineIndex(lines: Line[], index: number, divisor: number, resolve: (value: void | PromiseLike<void>) => void): void {
    if (index >= lines.length) {
      console.log(`visuByLineIndex : ${index}/${lines.length} resolve`);
      resolve();
    } else {
      const line = lines[index];
      line.leds.forEach((l) => {
        this.changingColor.next({ index: l.index, r: l.r/divisor, g: l.g/divisor, b: l.b/divisor });
      });
      setTimeout(() => {
        index += 1;
        this.visuByLineIndex(lines, index, divisor, resolve);
      }, line.duration);
    }
  }

  saveFileToBackend(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // create body with only useful attribut
      const options = anim.options.map((o) => {
        return { name: o.name, valueN: o.valueN, valueS: o.valueS, valueI: o.valueI };
      });
      const body = JSON.stringify({ anim: { titre: anim.titre, lines: anim.lines, options: options } });
      // console.log(body);

      this.httpClient
        .post<ApiReturn>(`/api/anim/save`, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            if (data && data.ok) {
              this.notificationService.launchNotif_OK(data.ok);
              this.animationsListNeedRefresh.next(true);
              resolve(data.ok);
            } else {
              this.notificationService.launchNotif_ERROR('Cannot save file');
              console.error(data);
              reject('Cannot save file');
            }
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            reject(error);
          },
        });
    });
  }

  saveProgramToBackend(program: LedProgram): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // create body with only useful attribut
      // const options = anim.options.map(o => {
      //   return {name:o.name, valueN: o.valueN, valueS: o.valueS}
      // })
      const body = JSON.stringify({ program: program });
      console.log(body);

      this.httpClient
        .post<ApiReturn>(`/api/program/save`, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            console.log('------------');
            console.log(data);
            if (data && data.ok) {
              this.notificationService.launchNotif_OK(data.ok);
              this.animationsListNeedRefresh.next(true);
              resolve(data.ok);
            } else {
              this.notificationService.launchNotif_ERROR('Cannot save file');
              console.error(data);
              reject('Cannot save file');
            }
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            reject(error);
          },
        });
    });
  }

  sendProgramToTree(program: LedProgram, divisor = 1): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const body = JSON.stringify({ program: program, divisor: divisor });
      console.log(body);

      this.httpClient
        .post<ApiReturn>(`/api/program/sendToTree`, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            console.log(data);
            if (data && data.ok) {
              this.notificationService.launchNotif_OK(data.ok);
              this.animationsListNeedRefresh.next(true);
              resolve(data.ok);
            } else {
              this.notificationService.launchNotif_ERROR('Cannot send files');
              console.error(data);
              reject('Cannot send files');
            }
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            reject(error);
          },
        });
    });
  }

  getProgramFromBackend(): Promise<LedProgram> {
    return new Promise<LedProgram>((resolve, reject) => {
      this.httpClient.get<ApiReturn>('/api/program').subscribe({
        next: (data) => {
          // console.log(data);
          if (data && data.program) {
            resolve(data.program);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR('Cannot read program');
            reject('Cannot read program');
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }

  deleteFileFromBackend(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // create body with only useful attribut

      this.httpClient.delete<ApiReturn>(`/api/anim/${encodeURIComponent(anim.titre)}`, {}).subscribe({
        next: (data) => {
          if (data && data.ok) {
            this.notificationService.launchNotif_OK(data.ok);
            this.animationsListNeedRefresh.next(true);
            resolve(data.ok);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR(`Cannot delete file`);
            reject('Cannot delete file');
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }

  getAnimationsList(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.httpClient.get<ApiReturn>('/api/anim').subscribe({
        next: (data) => {
          // console.log(data);
          if (data && data.animations) {
            resolve(data.animations);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR('Cannot read animations');
            reject('Cannot read animations');
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }

  getAnimationFromBackend(title: string): Promise<LedAnimation> {
    return new Promise<LedAnimation>((resolve, reject) => {
      // create body with only useful attribut

      this.httpClient.get<ApiReturn>(`/api/anim/${encodeURIComponent(title)}`, {}).subscribe({
        next: async (data) => {
          // console.log(data);
          if (data && data.anim) {
            let newAnim = data.anim;
            if (data.anim.titre.startsWith('Vertical_')) {
              newAnim = new LedAnimationVertical(data.anim.titre, this);
            } else if (data.anim.titre.startsWith('Sparkle_')) {
              newAnim = new LedAnimationSparkle(data.anim.titre, this);
            } else if (data.anim.titre.startsWith('Image_')) {
              newAnim = new LedAnimationImage(data.anim.titre, this);
            }
            newAnim.lines = data.anim.lines;
            newAnim.options.forEach((o) => {
              o.valueN = data.anim?.options.find((v) => v.name === o.name)?.valueN;
              o.valueS = data.anim?.options.find((v) => v.name === o.name)?.valueS;
              o.valueI = data.anim?.options.find((v) => v.name === o.name)?.valueI;
            });
            if (newAnim.initOptions) newAnim.initOptions();

            resolve(newAnim);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR(`Cannot get anim from backend`);
            reject('Cannot get anim from backend');
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }

  sortAnimations(animations: LedAnimation[]) {
    animations.sort((a, b) => {
      if (a.titre.match(/_[0-9]*$/) && b.titre.match(/_[0-9]*$/)) {
        return a.titre.localeCompare(b.titre);
      } else if (a.titre.match(/_[0-9]*$/)) {
        return 1;
      } else if (b.titre.match(/_[0-9]*$/)) {
        return -1;
      } else {
        return a.titre.localeCompare(b.titre);
      }
    });
  }
}
