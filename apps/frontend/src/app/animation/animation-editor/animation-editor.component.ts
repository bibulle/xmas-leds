/* eslint-disable @typescript-eslint/no-explicit-any */
import { Color, stringInputToObject } from '@angular-material-components/color-picker';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ImageAnimation, Led, LedAnimOption, LedAnimOptionType, LedAnimation, Point } from '@xmas-leds/api-interfaces';
import { catchError, of } from 'rxjs';
import { LedsService } from '../../leds/leds.service';
import { NotificationService } from '../../notification/notification.service';
import { AnimationService } from '../animation.service';
import { LedAnimationVertical } from '../led-animation-vertical';
import { LedAnimationSparkle } from '../led-animation-sparkle';
import { FileUploadService } from '../file-upload/file-upload.service';
import { LedAnimationImage } from '../led-animation-image';

@Component({
  selector: 'xmas-leds-animation-editor',
  templateUrl: './animation-editor.component.html',
  styleUrls: ['./animation-editor.component.scss'],
})
export class AnimationEditorComponent implements OnInit {
  private leds: Led[] = [];
  file: File | null = null; // Variable to store file
  loading = false; // Flag variable

  @Input() public points: Point[] = [];
  @ViewChild('inputfile') input?: ElementRef;
  @ViewChild('optionDiv') optionDiv?: ElementRef;

  colorCtrs: { [id: string]: FormControl } = {};

  optionHide = true;
  options: LedAnimOption[] = [];
  public color = '#FFFF00';

  imageAnimations: ImageAnimation[] = [];

  constructor(private animationService: AnimationService, private ledsService: LedsService, private fileUploadService: FileUploadService, private notificationService: NotificationService) {}

  public animations: LedAnimation[] = [
    new LedAnimationVertical('Vertical', this.animationService),
    new LedAnimationSparkle('Sparkle', this.animationService),
    new LedAnimationImage('Image', this.animationService),
  ];
  selectedAnim: LedAnimation | undefined;

  ngOnInit() {
    this.animationService.loadImageAnimations().then((value) => {
      if (value) {
        this.imageAnimations = value;
        this.selectedAnim?.options
          .filter((o) => o.type === LedAnimOptionType.IMAGE)
          .forEach((o) => {
            if (!o.valueI && this.imageAnimations.length > 0) {
              o.valueI = this.imageAnimations[0];
            }
          });
      }
    });
    this.animationService.animationsListNeedRefresh.subscribe(() => {
      // console.log("event received");
      this.refreshData();
    });
    this.refreshData();
  }

  selectAnimChange(event: MatSelectChange) {
    console.log(event.value);
    if (event.value) {
      const anim: LedAnimation = event.value as LedAnimation;

      // if translate option string to color
      anim.options
        .filter((o) => {
          return o.type === LedAnimOptionType.COLOR;
        })
        .forEach((o) => {
          if (o.valueS) {
            const obj = stringInputToObject(o.valueS) as Color;
            this.colorCtrs[o.name] = new FormControl(new Color(obj.r, obj.g, obj.b, obj.a), []);
          }
        });

      anim.options
        .filter((o) => o.type === LedAnimOptionType.IMAGE)
        .forEach((o) => {
          if (!o.valueI && this.imageAnimations.length > 0) {
            o.valueI = this.imageAnimations[0];
          }
        });
    }
  }

  refreshData() {
    this.animationService.getAnimationsList().then((anims) => {
      // console.log("backend : "+anims);

      // remove not existing
      this.animations = this.animations.filter((anim) => {
        return !anim.existOnBackend || anims.find((a) => a === anim.titre);
      });

      // add new one
      anims.forEach((name) => {
        // console.log(name);
        const anim = this.animations.find((a) => a.titre === name);
        if (!anim) {
          this.animationService.getAnimationFromBackend(name).then((anim) => {
            anim.existOnBackend = true;
            this.animations.push(anim);

            this.animationService.sortAnimations(this.animations);
            // console.log(this.animations);
          });
        }
      });
      if (!this.animations.find((v) => v.titre === this.selectedAnim?.titre)) {
        this.selectedAnim = undefined;
      }
    });
  }

  onImageClick(image: ImageAnimation) {
    console.log(`onImageClick(${image.name})`)
    this.selectedAnim?.options
      .filter((o) => o.type === LedAnimOptionType.IMAGE)
      .forEach((o) => {
        o.valueI = image;
      });
  }

  calculateClicked() {
    if (!this.selectedAnim || !this.selectedAnim.calculate || !this.selectedAnim.calculateInternal) {
      return;
    }
    // get Colors
    this.selectedAnim.options
      .filter((o) => o.type === LedAnimOptionType.COLOR)
      .forEach((o) => {
        // console.log((this.colorCtrs[o.name].value as Color).toRgbString());
        o.valueS = (this.colorCtrs[o.name].value as Color).toRgbString();
      });

    this.selectedAnim.calculate(this.points);
  }

  fileUploadButtonClicked() {
    if (this.input) {
      this.input.nativeElement.click();
    }
  }

  // On file Select
  fileUploadChange(event: Event) {
    const target = event.target as HTMLInputElement;

    if (target && target.files && target.files.length) {
      this.file = target.files[0];
      console.log(this.file);
    }
  }

  // OnClick of button Upload
  onUpload() {
    this.loading = !this.loading;
    // console.log(this.file);
    if (this.file) {
      this.fileUploadService
        .upload(this.file)
        .pipe(
          catchError((error) => {
            this.notificationService.launchNotif_ERROR(error);
            console.error(error);
            if (error && error.error && error.error.message) {
              console.error(`Error: ${error.error.message}`);
            } else {
              console.error(`Error: ${error.message}`);
            }
            return of('');
          })
        )
        .subscribe({
          next: (response) => {
            this.animationService.animationsListNeedRefresh.next(true);
            this.file = null;
            console.log(response);
          },
          error: (error) => {
            this.notificationService.launchNotif_ERROR(error);
            console.error(`${error.message} : ${error.response?.data} (${error.request.path})`);
            // reject(new HttpException(`Cannot connect to Strip (${error})`, HttpStatus.INTERNAL_SERVER_ERROR));
          },
        });
    }
  }

  // shownOptions(options: LedAnimOption[], event: MouseEvent) {
  //   if (this.optionDiv) {
  //     this.optionDiv.nativeElement.style.left = event.clientX+"px";
  //     this.optionDiv.nativeElement.style.top  = event.clientY+"px";
  //   }
  //   this.optionHide = false;
  //   this.options = options;
  // }
  // hideOptions() {
  //   console.log(this.options);

  //   this.optionHide = true;
  // }
}
