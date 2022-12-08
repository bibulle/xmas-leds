import { Component, OnInit } from '@angular/core';
import { Notif } from '@xmas-leds/api-interfaces';
import { NotificationService } from './notification.service';

@Component({
  selector: 'xmas-leds-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  notifs: Notif[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notificationObservable().subscribe((notif) => {
      this.notifs.push(notif);
      setTimeout(() => {
        this.notifs.length;
        this.notifs = this.notifs.filter((n) => n.id !== notif.id);
      }, 5000);
    });
  }
}
