import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Led } from '@xmas-leds/api-interfaces';
import { ConfigService } from '../config.service';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root',
})
export class LedsService {
  constructor(private httpClient: HttpClient, private configService: ConfigService, private notificationService: NotificationService) {
  }

  switchAllOff() {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }
      this.httpClient.get<ApiReturn>(`/api/leds/clear`).subscribe({
        next: (data) => {
          if (data && data.ok) {
            resolve(data.ok);
          } else {
            this.notificationService.launchNotif_ERROR('Cannot clear leds');
            console.error(data);
            reject('Cannot clear leds');
          }
        },
        error: (error) => {
          this.notificationService.launchNotif_ERROR(error);
          reject(error);
        },
      });
    });
  }

  switchOnALed(index: number) {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }
      const body = JSON.stringify({ leds: `${index} 255 255 255` });
      this.httpClient
        .post<ApiReturn>(`/api/leds/change`, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            if (data && data.ok) {
              resolve(data.ok);
            } else {
              this.notificationService.launchNotif_ERROR('Cannot switch on leds');
              console.error(data);
              reject('Cannot switch on leds');
            }
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            reject(error);
          },
        });
    });
  }

  changeSomeLeds(leds: Led[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }
      if (leds.length == 0) {
        return resolve('Nothing to do (empty leds)');
      }
      const body = JSON.stringify({ leds: leds });
      this.httpClient
        .post<ApiReturn>(`/api/leds/change`, body, {
          headers: new HttpHeaders({
            Accept: 'application/json',
            'Content-Type': 'application/json',
          }),
        })
        .subscribe({
          next: (data) => {
            if (data && data.ok) {
              resolve(data.ok);
            } else {
              this.notificationService.launchNotif_ERROR('Cannot switch on leds');
              console.error(data);
              reject('Cannot change leds');
            }
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            reject(error);
          },
        });
    });
  }

  getAnimationsList(): Promise<string[] | string> {
    return new Promise<string[] | string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }

      this.httpClient.get<ApiReturn>('/api/anim/leds').subscribe({
        next: (data) => {
          // console.log(data);
          if (data && data.animations) {
            resolve(data.animations);
          } else {
            this.notificationService.launchNotif_ERROR('Cannot read animations');
            console.error(data);
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

  toggleStartAnims(stop: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.httpClient.get<ApiReturn>(`/api/anim/${stop ? 'start' : 'stop'}`).subscribe({
        next: (data) => {
          // console.log(data);
          if (data && data.ok) {
            resolve(data.ok);
          } else {
            this.notificationService.launchNotif_ERROR('Cannot read animations');
            console.error(data);
            reject('Cannot start/stop anims');
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
