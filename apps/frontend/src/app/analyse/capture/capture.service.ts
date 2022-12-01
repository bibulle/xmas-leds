import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiReturn } from '@xmas-leds/api-interfaces';
import { WebcamImage } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';
import { ConfigService } from '../../config.service';

@Injectable({
  providedIn: 'root',
})
export class CaptureService {


  // webcam snapshot trigger
  private captureImageTrigger: Subject<void> = new Subject<void>();
  // image received
  private image: WebcamImage | undefined;

  constructor(private httpClient: HttpClient, private configService: ConfigService) {
  }

  /**
   * Capture an image (and return it's URL or base64)
   * @param angle
   * @param index
   */
  captureImage(angle: number, index: number): Promise<string> {
    return new Promise((resolve, reject) => {

      if (this.configService.isLoadCaptureFromDiskEnabled()) {
        return resolve(`/api/image/loadCapture/${angle}/${index}`); 
      }

      // console.log('captureImage');
      this.captureImageTrigger.next();

      for (let i = 0; i < 1000; i++) {
        if (this.image) {
          this.sendImageToBackend(angle, index, this.image);
          return resolve(this.image.imageAsDataUrl);
        }
      }
      reject('Cannot capture image !!');
    });
  }

  handleImage(webcamImage: WebcamImage) {
      this.image = webcamImage;
  }
  captureImageObservable(): Observable<void> {
    return this.captureImageTrigger.asObservable();
  }

  sendImageToBackend(angle: number, index: number, image: WebcamImage): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const body = JSON.stringify({ image: image.imageAsBase64 });
    this.httpClient
    .post<ApiReturn>(`/api/image/saveCapture/${angle}/${index}`, body, {
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
