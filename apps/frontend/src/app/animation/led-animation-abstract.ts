import { Color, ImageAnimation, Led, LedAnimation, LedAnimOption, LedAnimOptionType, Line, Point } from '@xmas-leds/api-interfaces';
import { AnimationService } from './animation.service';

export abstract class LedAnimationAbstract implements LedAnimation {
  titre = '';
  existOnBackend = false;
  existOnTree = false;
  lines: Line[] = [];

  options: LedAnimOption[] = [];
  lastOptions: string = '';

  constructor(titre: string, private animationService: AnimationService) {
    this.titre = titre;
  }

  /**
   * Get the option value
   */
  getOption(name: string): undefined | number | Color| ImageAnimation {
    const find = this.options.find((o) => o.name.toLowerCase() === name.toLowerCase());
    if (!find) {
      return undefined;
    } else if (find.valueS && find.type === LedAnimOptionType.COLOR) {
      return Color.fromString(find.valueS);
    } else if (find.valueI && find.type === LedAnimOptionType.IMAGE) {
      return find.valueI as ImageAnimation;
    } else {
      return find.valueN;
    }
  }

  /**
   * Calculate the animations
   */
  abstract calculateInternal: ((points: Point[]) => void) | undefined;
  calculate(points: Point[]) {
    this.initOptions();
    if (this.calculateInternal) {
      this.calculateInternal(points);
    }
  }

  initOptions(): void {
    this.lastOptions = JSON.stringify(this.options);
  }
  optionsChanged(): boolean {
    return this.lastOptions !== JSON.stringify(this.options);
  }

  /**
   * Save a "line" into the animation during the calculation (internaly in the leds ans lines var)
   * @param duration
   */
  saveLine(duration: number, leds: Led[]) {
    this.lines.push({
      duration: duration,
      leds: leds.map((l) => {
        return { index: l.index, r: Math.round(l.r), g: Math.round(l.g), b: Math.round(l.b) };
      }),
    });
    // leds.forEach((l) => {
    //   this.animationService.changingColor.next({ index: l.index, r: l.r, g: l.g, b: l.b });
    // });
  }
  /**
   * Clear the animation (before a new animation)
   * @param anim
   */
  clearFile() {
    this.lines = [];
  }
  /**
   * Visu from lines objects
   */
  visuByLine() {
    this.animationService.visuByLine(this.lines);
  }
  /**
   * Save the animation to the backend
   */
  saveFileToBackend() {
    this.animationService.saveFileToBackend(this);
  }
  /**
   * Delete the animation from the backend
   */
  deleteFileFromBackend() {
    this.animationService.deleteFileFromBackend(this);
  }
  /**
   * Visu from the backend (from the saved file)
   */
  visuFromBackend() {
    this.animationService.visuFromBackend(this);
  }

  /**
   * Send the animation to the leds strip (directly, without using a file)
   */
  mimicToTree() {
    this.animationService.mimicToTree(this.lines);
  }
}
