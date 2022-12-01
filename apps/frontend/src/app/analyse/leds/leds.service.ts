import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn } from '@xmas-leds/api-interfaces';
import { ConfigService } from '../../config.service';

@Injectable({
  providedIn: 'root',
})
export class LedsService {
  constructor(private httpClient: HttpClient, private configService: ConfigService) {}

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
}
