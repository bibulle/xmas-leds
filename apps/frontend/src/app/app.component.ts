import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LedsStatus } from '@xmas-leds/api-interfaces';
import { from, mergeMap } from 'rxjs';
import { ConfigService } from './config.service';
import { LedsService } from './leds/leds.service';

@Component({
  selector: 'xmas-leds-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  public ledStatus : LedsStatus | undefined;
  public freeBytes = "";

  constructor(private route: ActivatedRoute, private configService: ConfigService, private ledsService: LedsService) {
    this.route.queryParams
      .pipe(
        mergeMap((params) => {
          return from(Object.keys(params).map((p) => {
            return { key: p, value: params[p] };
          }));
        })
      )
      .subscribe((p) => {
        this.configService.manage(p.key, p.value);
      });

      this.ledsService.getStatusObservable().subscribe((s => {
        this.ledStatus = s;
        if (s && s.totalBytes && s.usedBytes) {
          this.freeBytes = this.formatSize(s.totalBytes - s.usedBytes);
        }
      }));
  }

  formatSize(b:number):string {
    if (b > 1024*1024) {
      return (b/1024/1024).toFixed(2)+" Go";
    }
    if (b > 1024) {
      return (b/1024).toFixed(2)+" Ko";
    }
    return (b)+"o";
  }
}
