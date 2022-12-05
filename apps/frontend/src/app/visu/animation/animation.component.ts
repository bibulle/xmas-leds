/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, OnInit } from '@angular/core';
import { Led, LedAnimation, Point } from '@xmas-leds/api-interfaces';
import { AnimationService } from './animation.service';
import { LedAnimationUploaded } from './led-animation-uploaded';
import { LedAnimationVertical } from './led-animation-vertical';

@Component({
  selector: 'xmas-leds-animation',
  templateUrl: './animation.component.html',
  styleUrls: ['./animation.component.scss'],
})
export class AnimationComponent implements OnInit {
  private leds: Led[] = [];

  @Input() public points: Point[] = [];

  constructor(private animationService: AnimationService) {

  }

  public animations: LedAnimation[] = [ new LedAnimationVertical("Vertical", this.animationService)];


  ngOnInit() {
    this.animationService.getAnimationsList().then(anims => {
      // console.log(anims);
      
      anims.forEach(name => {
        // console.log(name);

        let anim = this.animations.find(a => a.titre === name);
        if (!anim) {
          anim = new LedAnimationUploaded(name, this.animationService)
          this.animations.push(anim);
        }

        anim.existOnBackend = true;
      })
    })
  }

}

