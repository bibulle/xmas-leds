import { Component, Input, OnInit } from '@angular/core';
import { ImageAnimation, LedAnimation, LedAnimOptionType, LedProgram, Point } from '@xmas-leds/api-interfaces';
import { AnimationService } from '../animation.service';

@Component({
  selector: 'xmas-leds-animation-display',
  templateUrl: './animation-display.component.html',
  styleUrl: './animation-display.component.scss',
})
export class AnimationDisplayComponent implements OnInit {
  public program = new LedProgram();
  public animations: LedAnimation[] = [];
  public imageAnimations: ImageAnimation[] = [];

  public animRunning = "";

  divisor: number = 7;

  @Input() public points: Point[] = [];

  constructor(private animationService: AnimationService) {}

  ngOnInit(): void {
    this.animationService.loadImageAnimations().then((images) => {
      if (images) {
        this.imageAnimations = images;
      }
    });
    this.animationService.animationsListNeedRefresh.subscribe(() => {
      // console.log("event received");
      this.refreshData();
    });
    this.refreshData();
  }

  refreshData() {
    this.animationService.getProgramFromBackend().then((program) => {
      // console.log(program);
      this.program = program;
    });

    this.animationService.getAnimationsList().then((anims) => {
      // console.log("backend : "+anims);

      // remove not existing and base animations (keep only calculated ones with _XXXX suffix)
      this.animations = this.animations.filter((anim) => {
        return anims.find((a) => a === anim.titre) && this.isCalculatedAnim(anim.titre);
      });
      this.program.anims = this.program.anims.filter((name) => {
        return anims.find((a) => a === name) && this.isCalculatedAnim(name);
      });

      // add new one (only calculated animations with _XXXX suffix)
      anims
        .filter((name) => this.isCalculatedAnim(name))
        .forEach((name) => {
          // console.log(name);
          const anim1 = this.animations.find((a) => a.titre === name);
          if (!anim1) {
            this.animationService.getAnimationFromBackend(name).then((anim) => {
              this.animations.push(anim);
            });
          }

          // console.log(`${name} : ${JSON.stringify(this.program.anims)}`);
          if (!this.program.anims.find((a) => a === name)) {
            this.program.anims = [...this.program.anims, name];
          }
        });
    });
  }

  swapAnim(index: number, event: MouseEvent) {
    event.stopPropagation();

    if (index < 1 || index >= this.animations.length) {
      console.error(`Wrong index in swapAnim ({index})`);
      return;
    }

    const temp = this.program.anims[index];
    this.program.anims[index] = this.program.anims[index - 1];
    this.program.anims[index - 1] = temp;

    this.animationService.saveProgramToBackend(this.program);
  }

  getProgramDuration() {
    return this.program.anims.reduce((duration, a) => {
      const dur = this.getAnimDuration(a) || 0;

      return duration + dur * this.getRepeatAnim(a);
    }, 0);
  }
  getAnim(name: string): LedAnimation | undefined {
    return this.animations.find((a) => a.titre === name);
  }

  // Vérifie si l'animation est une animation calculée (avec suffixe _XXXX)
  isCalculatedAnim(name: string): boolean {
    return /_\d{4}$/.test(name);
  }
  getAnimDuration(name: string): number | undefined {
    return this.getAnim(name)?.options.find((o) => o.name.toLowerCase() === 'duration')?.valueN;
  }
  getRepeatAnim(name: string): number {
    if (!this.program.repeat[name]) {
      this.program.repeat[name] = 0;
    }
    return this.program.repeat[name];
  }

  getImageColors(name: string): { name: string; valueS: string }[] {
    const anim = this.getAnim(name);
    if (!anim) return [];

    const imageOption = anim.options.find((o) => o.type === LedAnimOptionType.IMAGE);
    if (!imageOption || !imageOption.valueS) return [];

    try {
      return JSON.parse(imageOption.valueS) as { name: string; valueS: string }[];
    } catch {
      return [];
    }
  }

  getAnimImage(name: string): ImageAnimation | undefined {
    const anim = this.getAnim(name);
    if (!anim) return undefined;

    const imageOption = anim.options.find((o) => o.type === LedAnimOptionType.IMAGE);
    if (!imageOption || !imageOption.valueI) return undefined;

    // Trouver l'image correspondante dans imageAnimations (pour avoir les frames)
    return this.imageAnimations.find((img) => img.name === imageOption.valueI?.name);
  }
  incrementRepeat(increment: number, name: string, event: MouseEvent) {
    event.stopPropagation();
    if (!this.program.repeat[name]) {
      this.program.repeat[name] = 0;
    }

    this.program.repeat[name] += increment;

    this.animationService.saveProgramToBackend(this.program);
  }

  sendToTree() {
    console.log("sendToTree start")
    this.animationService.sendProgramToTree(this.program, this.divisor).finally(() => {
      console.log("sendToTree done")
    });
  }

  async showProgram() {
    
    // const exec = this.program.anims.flatMap((anim) => {
    //   const promises:Promise<void>[] = [];
    //   for (let r = 0; r < this.getRepeatAnim(anim); r++) {
    //     console.log(`           : ${anim} / ${r}`);
    //     const animation = this.getAnim(anim);
    //     if (animation && animation.lines) {
    //       promises.push(this.animationService.visuByLine(animation.lines));
    //     }
    //     console.log(`      done : ${anim} / ${r}`);
    //   }
    //   return promises;
    // }, []);

    // console.log(exec);

    // exec.forEach((p,i)=> {
    //   console.log(`start ${i}`);
    //   await p.then()
    //   console.log(` done ${i}`);
    // })
    // Promise.all(exec);

    for (let index = 0; index < this.program.anims.length; index++) {
      this.animRunning = this.program.anims[index];
      console.log(`Start anim : ${this.animRunning}`);
      for (let r = 0; r < this.getRepeatAnim(this.animRunning); r++) {
        console.log(`           : ${this.animRunning} / ${r}`);
        const animation = this.getAnim(this.animRunning);
        if (animation && animation.lines) {
          await this.animationService.visuByLine(animation.lines).then(() => {
            console.log(`       mid : ${this.animRunning} / ${r}`);
          }).catch(r => {
            console.error(r);
          }).finally(() => {
            console.log(`       fin : ${this.animRunning} / ${r}`);
          });
        }
        console.log(`      done : ${this.animRunning} / ${r}`);
      }
    }
  }
}
