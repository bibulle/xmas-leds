import { Component } from '@angular/core';
import { WebcamImage, WebcamInitError } from 'ngx-webcam';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config.service';
import { NotificationService } from '../../notification/notification.service';
import { CaptureService } from './capture.service';

@Component({
  selector: 'xmas-leds-capture',
  templateUrl: './capture.component.html',
  styleUrls: ['./capture.component.scss'],
})
export class CaptureComponent {
  showWebcam = true;

  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 1024 },
    height: { ideal: 576 },
  };
  public errors: WebcamInitError[] = [];

  constructor(private captureService: CaptureService, private configService: ConfigService, private notificationService: NotificationService) {}

  public async handleImage(webcamImage: WebcamImage): Promise<void> {
    this.captureService.handleImage(webcamImage);
  }
  public handleInitError(error: WebcamInitError): void {
    this.notificationService.launchNotif_ERROR(error.message);
    console.error(error);
    this.errors.push(error);
  }

  public get triggerObservable(): Observable<void> {
    return this.captureService.captureImageObservable();
  }
}
