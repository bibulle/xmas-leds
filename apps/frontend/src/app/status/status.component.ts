import { Component, OnInit } from '@angular/core';
import { LedsStatus } from '@xmas-leds/api-interfaces';
import { LedsService } from '../leds/leds.service';

@Component({
  selector: 'xmas-leds-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent implements OnInit {
  public ledStatus: LedsStatus | undefined;
  public freeBytes = '';

  constructor(private ledsService: LedsService) {}

  ngOnInit() {
    this.ledsService.getStatusObservable().subscribe((s) => {
      // console.log(`ledStatus ${s}`);
      this.ledStatus = s;
      if (s && s.totalBytes && s.usedBytes) {
        this.freeBytes = this.formatSize(s.totalBytes - s.usedBytes);
      }
    });
  }

  formatSize(b: number): string {
    if (b > 1024 * 1024) {
      return (b / 1024 / 1024).toFixed(2) + ' Go';
    }
    if (b > 1024) {
      return (b / 1024).toFixed(2) + ' Ko';
    }
    return b + 'o';
  }

  startAnims() {
    // console.log("startAnims");
    this.ledsService.toggleStartAnims(true);
  }
  stopAnims() {
    // console.log("stopAnims");
    this.ledsService.toggleStartAnims(false);
  }
}
