import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Point, ApiReturn } from '@xmas-leds/api-interfaces';

@Injectable({
  providedIn: 'root',
})
export class PointsService {
  constructor(private httpClient: HttpClient) {}

  sendPointsToBackend(points: Point[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const body = { points: points };
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
              reject('Cannot save Points');
            }
          },
          error: (error) => {
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
            reject('Cannot save Points');
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }
}
