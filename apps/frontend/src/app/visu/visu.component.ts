import { Component, OnInit } from '@angular/core';
import { Led, Point } from '@xmas-leds/api-interfaces';
import { Subject } from 'rxjs';
import { PointsService } from '../points/points.service';

@Component({
  selector: 'xmas-leds-visu',
  templateUrl: './visu.component.html',
  styleUrls: ['./visu.component.scss'],
})
export class VisuComponent implements OnInit {
  points: Point[] = [];

  constructor(private pointsService: PointsService) {}

  ngOnInit(): void {
    this.pointsService.getPointsFromBackend().then((points) => {
      this.points = points;
    });
  }

}
