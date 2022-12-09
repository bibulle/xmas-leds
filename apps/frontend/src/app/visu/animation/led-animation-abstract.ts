import { Led, LedAnimation, Line, Point } from "@xmas-leds/api-interfaces";
import { AnimationService } from "./animation.service";

export abstract class LedAnimationAbstract implements LedAnimation {
  
  titre = "";
  existOnBackend = false;
  existOnTree = false;
  lines: Line[] = [];
  leds: Led[] = [];


  constructor(titre: string, private animationService: AnimationService) {
    this.titre = titre;
  }

  /**
   * Calculate the animations
   */
  abstract calculate : ((points: Point[]) => void) | undefined;

  /**
   * Set a color led into the animation (to be added in the current line)
   * @param index 
   * @param r 
   * @param g 
   * @param b 
   */
  setLedColor(index: number, r: number, g: number, b: number) {
    this.leds.push({ index: index, r: r, g: g, b: b });
  }
  /**
   * Save a "line" into the animation during the calculation (internaly in the leds ans lines var)
   * @param duration 
   */
  saveLine(duration: number) {
    this.lines.push({ duration: duration, leds: this.leds });
    this.leds.forEach(l => {
      this.animationService.changingColor.next({ index: l.index, r: l.r, g: l.g, b: l.b });
    })
    this.leds = [];
  }
  /**
   * Clear the animation (before a new animation)
   * @param anim
   */
   clearFile() {
    this.lines = [];
    this.leds = [];
  }
  /**
   * Save the animation to the backend
   */
   saveFileToBackend() {
    this.animationService.saveFileToBackend(this)
  }
  /**
   * Delete the animation from the backend
   */
   deleteFileFromBackend() {
    this.animationService.deleteFileFromBackend(this)
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
   sendAnimToTree() {
    this.animationService.sendAnimToTree(this.lines);
  }
  /**
   * Push the animation in the leds strip
   */
   pushToTree() {
    this.animationService.pushToTree(this);
  }
  /**
   * Delete the animation from the leds strip
   */
   deleteFromTree() {
    this.animationService.deleteFromTree(this);
  }
  /**
   * Exec the animation in the leds strip
   */
   execOnTree() {
    this.animationService.execOnTree(this);
  }

}