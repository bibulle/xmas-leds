import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Point, ApiReturn } from '@xmas-leds/api-interfaces';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root',
})
export class PointsService {
  constructor(private httpClient: HttpClient, private notificationService: NotificationService) {}

  sendPointsToBackend(points: Point[], useBaseFile?: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const body = { points: points, useBaseFile: useBaseFile };
      this.httpClient
        .post<ApiReturn>(`/api/savePoints`, body, {
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
              this.notificationService.launchNotif_ERROR('Cannot save Points');
              reject('Cannot save Points');
            }
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            reject(error);
          },
        });
    });
  }

  getPointsFromBackend(): Promise<Point[]> {
    return new Promise<Point[]>((resolve, reject) => {
      this.httpClient
      .get<ApiReturn>(`/api/getPointsJson`)
      .subscribe({
        next: (data) => {
          if (data && data.points) {
            resolve(data.points);
          } else {
            console.error(data);
            this.notificationService.launchNotif_ERROR('Cannot get Points');
            reject('Cannot get Points');
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
