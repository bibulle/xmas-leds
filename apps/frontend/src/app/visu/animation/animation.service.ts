import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn, Led, LedAnimation, Line } from '@xmas-leds/api-interfaces';
import { Subject } from 'rxjs';
import { ConfigService } from '../../config.service';
import { LedsService } from '../../leds/leds.service';

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  constructor(private ledsService: LedsService, private httpClient: HttpClient, private configService: ConfigService) {}

  changingColor: Subject<Led> = new Subject();

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

  saveFileToBackend(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // create body with only usefull attriubt
      const body = JSON.stringify({ anim: { titre: anim.titre, lines: anim.lines } });
      console.log(body);

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
              resolve(data.ok);
            } else {
              console.error(data);
              reject('Cannot save file');
            }
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }
  deleteFileFromBackend(anim: LedAnimation) {
    throw new Error("Method not implemented.");
  }


  pushToTree(anim: LedAnimation): Promise<string> {
    return new Promise<string>((resolve, reject) => {

      if (this.configService.isDontUseLedEnable()) {
        return resolve('No done');
      }

      this.httpClient.get<ApiReturn>(`/api/anim/push/${encodeURIComponent(anim.titre)}`).subscribe({
        next: (data) => {
          if (data && data.ok) {
            resolve(data.ok);
          } else {
            console.error(data);
            reject(`Cannot push anim ${anim.titre}`);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }
  deleteFromTree(anim: LedAnimation) {
    throw new Error("Method not implemented.");
  }
  execOnTree(anim: LedAnimation) {
    throw new Error("Method not implemented.");
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
            reject('Cannot read animations');
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

}
