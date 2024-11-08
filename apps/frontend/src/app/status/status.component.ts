import { Component, OnInit } from '@angular/core';
import { LedsStatus } from '@xmas-leds/api-interfaces';
import { LedsService } from '../leds/leds.service';
import { AnimationService } from '../animation/animation.service';
import { StatusService } from './status.service';

@Component({
  selector: 'xmas-leds-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
})
export class StatusComponent implements OnInit {
  public ledStatus: LedsStatus | undefined;
  public freeBytes = '';

  progress: number = 0;

  constructor(private ledsService: LedsService, private animationService: AnimationService, private statusService: StatusService) {}

  ngOnInit() {
    this.statusService.onProgress().subscribe((progress: number) => {
      if (progress < 100) {
        this.progress = progress;
      } else {
        this.progress = 0;
      }
    });
    this.statusService.onStatus().subscribe((status: LedsStatus) => {
      this.ledStatus = status;
      if (status && status.totalBytes && status.usedBytes) {
        this.freeBytes = this.formatSize(status.totalBytes - status.usedBytes);
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
