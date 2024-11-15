import { AfterViewInit, Component, ElementRef, Input, ViewChild, HostListener, OnDestroy } from '@angular/core';
import { ImageAnimation } from '@xmas-leds/api-interfaces';

@Component({
  selector: 'xmas-leds-pixel-canvas',
  templateUrl: './pixel-canvas.component.html',
  styleUrls: ['./pixel-canvas.component.css']
})
export class PixelCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('animationCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  @Input() image: ImageAnimation | undefined;
  @Input() size: number = 50; // Taille normale du canvas
  @Input() sizeHover: number = 80; // Taille du canvas lors du hover
  @Input() animationDuration: number = 2000; // Durée totale de l'animation en ms

  currentFrame: number = 0;
  isHovered: boolean = false; // Indique si le canvas est survolé

  private animationId: number | null = null; // Pour gérer l'animation
  private lastTimestamp: number | null = null; // Dernier timestamp capturé
  private frameDuration: number = 0; // Durée d'une frame

  constructor() {}

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.startAnimation();
  }

  initializeCanvas(): void {
    if (!this.image) return;

    const canvasElement = this.canvas.nativeElement;

    // Configure la taille initiale du canvas
    canvasElement.width = this.size;
    canvasElement.height = this.size;

    // Calcul de la durée d'une frame
    this.frameDuration = this.animationDuration / this.image.frames.length;
  }

  startAnimation(): void {
    const animate = (timestamp: number) => {
      if (this.lastTimestamp === null) {
        this.lastTimestamp = timestamp;
      }

      const elapsed = timestamp - this.lastTimestamp;

      if (elapsed >= this.frameDuration) {
        this.updateFrame();
        this.lastTimestamp = timestamp;
      }

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  updateFrame(): void {
    if (!this.image) return;

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const effectiveSize = this.canvas.nativeElement.width;

    // Efface le canvas
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    const gridHeight = this.image.frames[0].length; // Nombre de lignes
    const gridWidth = this.image.frames[0][0].length; // Nombre de colonnes

    const pixelWidth = effectiveSize / gridWidth;
    const pixelHeight = effectiveSize / gridHeight;

    const frame = this.image.frames[this.currentFrame];

    // Dessiner chaque pixel
    frame.forEach((row, y) => {
      row.forEach((color, x) => {
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
      });
    });

    // Passe à la frame suivante
    this.currentFrame = (this.currentFrame + 1) % this.image.frames.length;
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.isHovered = true;
    this.updateCanvasSize();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.isHovered = false;
    this.updateCanvasSize();
  }

  updateCanvasSize(): void {
    const canvasElement = this.canvas.nativeElement;
    const effectiveSize = this.isHovered ? this.sizeHover : this.size;

    canvasElement.width = effectiveSize;
    canvasElement.height = effectiveSize;
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
