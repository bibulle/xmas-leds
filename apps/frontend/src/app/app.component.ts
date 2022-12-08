import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { from, mergeMap } from 'rxjs';
import { ConfigService } from './config.service';

@Component({
  selector: 'xmas-leds-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private route: ActivatedRoute, private configService: ConfigService) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        mergeMap((params) => {
          return from(
            Object.keys(params).map((p) => {
              return { key: p, value: params[p] };
            })
          );
        })
      )
      .subscribe((p) => {
        this.configService.manage(p.key, p.value);
      });
  }
}
