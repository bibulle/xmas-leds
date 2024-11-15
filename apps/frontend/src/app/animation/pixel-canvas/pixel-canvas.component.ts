import { Component, Input, OnInit } from '@angular/core';
import { ImageAnimation } from '@xmas-leds/api-interfaces';

@Component({
  selector: 'xmas-leds-pixel-canvas',
  templateUrl: './pixel-canvas.component.html',
  styleUrl: './pixel-canvas.component.css'
})
export class PixelCanvasComponent implements OnInit {


  @Input() image: ImageAnimation|undefined;

  @Input() size: number = 50;
  @Input() sizeHover: number = 80;
  pixelSize: number = 0;

  currentFrame: number = 0;

  hover: boolean = false;

  constructor() { }

  ngOnInit(): void {

    this.pixelSize = this.size;
    this.startAnimation();

  }

  startAnimation() {
    const animate = () => {
      this.updateFrame();
      setTimeout(() => requestAnimationFrame(animate), 500); // Cadence de 500ms
    };
    animate();
  }
  
  // Mise à jour de la frame actuelle (animation)
  updateFrame() {
    if (this.image) {
      this.currentFrame = (this.currentFrame + 1) % this.image.frames.length; // Passer à la prochaine frame
    }
  }

}
