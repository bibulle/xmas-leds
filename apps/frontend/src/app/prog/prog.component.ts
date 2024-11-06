import { Component, Input, OnInit } from '@angular/core';
import { Point } from '@xmas-leds/api-interfaces';
import { AnimationService } from '../animation/animation.service';
import { PointsService } from '../points/points.service';

@Component({
  selector: 'xmas-leds-prog',
  templateUrl: './prog.component.html',
  styleUrl: './prog.component.scss',
})
export class ProgComponent implements OnInit {
  
  @Input() public points: Point[] = [];
  
  constructor(private pointsService: PointsService, private animationService: AnimationService) {}

  ngOnInit(): void {
    this.pointsService.getPointsFromBackend().then((points) => {
      this.points = points;
    });
  }

  
}
