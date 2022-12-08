import { Injectable } from '@angular/core';
import { Notif, NotifLevel } from '@xmas-leds/api-interfaces';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  subject = new Subject<Notif>();

  private launchNotif(level: NotifLevel, msg: string) {
    this.subject.next(new Notif(level, msg));
  }

  launchNotif_OK(msg: any) {
    this.launchNotif(NotifLevel.OK, msg);
  }
  launchNotif_WARN(msg: any) {
    this.launchNotif(NotifLevel.WARN, msg);
  }
  launchNotif_ERROR(error: any) {
    console.error(error);
    let msg="ERROR";
    if (error && error.error && error.error.message) {
      msg = error.error.message;
    } else if (error && error.message) {
      msg = error.message;
    } else {
      msg = error;
    }
    this.launchNotif(NotifLevel.ERROR, msg);
  }

  notificationObservable(): Observable<Notif> {
    return this.subject.asObservable();
  }
}
