import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Led, LedAnimation, Line } from '@xmas-leds/api-interfaces';
import { Subject } from 'rxjs';
import { ConfigService } from '../../config.service';
import { LedsService } from '../../leds/leds.service';
import { NotificationService } from '../../notification/notification.service';

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  constructor(private ledsService: LedsService, private httpClient: HttpClient, private configService: ConfigService, private notificationService: NotificationService) {}

  changingColor: Subject<Led> = new Subject();
  animationsListNeedRefresh: Subject<boolean> = new Subject();

  async sendAnimToTree(lines: Line[]) {
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
      // create body with only usefull attriubt

      this.httpClient.get<ApiReturn>(`/api/anim/${encodeURIComponent(anim.titre)}`, {}).subscribe({
        next: async (data) => {
          // console.log(data);
          if (data && data.anim) {
            await this.visuByLine(data.anim.lines)
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

  async visuByLine(lines: Line[], index = 0): Promise<void> {
    return new Promise<void>((resolve) => {
      if (index >= lines.length ) {
        return resolve();
      }
      const line = lines[index];
      line.leds.forEach((l) => {
        this.changingColor.next({ index: l.index, r: l.r, g: l.g, b: l.b });
      });
      setTimeout(() => {
        this.visuByLine(lines, index + 1);
      }, line.duration);
    });
  }

  saveFileToBackend(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // create body with only usefull attriubt
      const body = JSON.stringify({ anim: { titre: anim.titre, lines: anim.lines } });
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

  deleteFileFromBackend(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // create body with only usefull attriubt

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

  pushToTree(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        this.notificationService.launchNotif_WARN("Not connected to led");
        return resolve('Not done');
      }

      this.httpClient.get<ApiReturn>(`/api/anim/leds/push/${encodeURIComponent(anim.titre)}`).subscribe({
        next: (data) => {
          if (data && data.ok) {
            this.notificationService.launchNotif_OK(data.ok);
            this.animationsListNeedRefresh.next(true);
            resolve(data.ok);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR(`Cannot push anim ${anim.titre}`);
            reject(`Cannot push anim ${anim.titre}`);
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }
  deleteFromTree(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        this.notificationService.launchNotif_WARN("Not connected to led");
        return resolve('Not done');
      }

      this.httpClient.delete<ApiReturn>(`/api/anim/leds/${encodeURIComponent(anim.titre)}`).subscribe({
        next: (data) => {
          if (data && data.ok) {
            this.notificationService.launchNotif_OK(data.ok);
            this.animationsListNeedRefresh.next(true);
            resolve(data.ok);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR(`Cannot delete anim ${anim.titre}`);
            reject(`Cannot delete anim ${anim.titre}`);
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }
  execOnTree(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        this.notificationService.launchNotif_WARN("Not connected to led");
        return resolve('Not done');
      }

      this.httpClient.get<ApiReturn>(`/api/anim/leds/exec/${encodeURIComponent(anim.titre)}`).subscribe({
        next: (data) => {
          if (data && data.ok) {
            this.notificationService.launchNotif_OK(data.ok);
            resolve(data.ok);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR(`Cannot exec anim ${anim.titre}`);
            reject(`Cannot exec anim ${anim.titre}`);
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
}
