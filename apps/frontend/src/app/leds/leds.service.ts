import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Led, LedsStatus } from '@xmas-leds/api-interfaces';
import { Observable, Subject } from 'rxjs';
import { ConfigService } from '../config.service';

@Injectable({
  providedIn: 'root',
})
export class LedsService {
  constructor(private httpClient: HttpClient, private configService: ConfigService) {
    setInterval(() => {
      this.getStatus();
    }, 4000);
    this.getStatus();
  }

  private ledStatusTrigger: Subject<LedsStatus|undefined> = new Subject<LedsStatus|undefined>();

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
            console.error(data);
            reject('Cannot update rating');
          }
        },
        error: (error) => {
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
      const body = JSON.stringify({ leds: `${index} 148 148 148` });
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
              console.error(data);
              reject('Cannot update rating');
            }
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  changeSomeLeds(leds: Led[]):Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }
      if (leds.length == 0) {
        return resolve("Nothing to do (empty leds)");
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
              console.error(data);
              reject('Cannot update rating');
            }
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }


  getStatus(): Promise<LedsStatus | string> {
    return new Promise<LedsStatus | string>((resolve, reject) => {
      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }
      this.httpClient.get<ApiReturn>(`/api/leds/getStatus`).subscribe({
        next: (data) => {
          if (data && data.status) {
            this.ledStatusTrigger.next(data.status);
            resolve(data.status);
          } else {
            this.ledStatusTrigger.next(undefined);
            console.error(data);
            reject('Cannot update rating');
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  getStatusObservable(): Observable<LedsStatus|undefined> {
    return this.ledStatusTrigger.asObservable();
  }
}
