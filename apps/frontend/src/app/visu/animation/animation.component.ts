/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Led, LedAnimation, LedAnimOption, Point } from '@xmas-leds/api-interfaces';
import { catchError, of, Subject } from 'rxjs';
import { LedsService } from '../../leds/leds.service';
import { NotificationService } from '../../notification/notification.service';
import { AnimationService } from './animation.service';
import { FileUploadService } from './file-upload/file-upload.service';
import { LedAnimationSparkle } from './led-animation-sparkle';
import { LedAnimationUploaded } from './led-animation-uploaded';
import { LedAnimationVertical } from './led-animation-vertical';

@Component({
  selector: 'xmas-leds-animation',
  templateUrl: './animation.component.html',
  styleUrls: ['./animation.component.scss'],
})
export class AnimationComponent implements OnInit {
  private leds: Led[] = [];
  file: File | null = null; // Variable to store file
  loading = false; // Flag variable

  @Input() public points: Point[] = [];
  @ViewChild('inputfile') input?: ElementRef;
  @ViewChild('optionDiv') optionDiv?: ElementRef;

  optionHide = true;
  options: LedAnimOption[] = [];
  public color ="#FFFF00"

  constructor(private animationService: AnimationService, private ledsService: LedsService, private fileUploadService: FileUploadService, private notificationService: NotificationService) {}

  public animations: LedAnimation[] = [new LedAnimationVertical('Vertical', this.animationService), new LedAnimationSparkle('Sparkle', this.animationService)];

  ngOnInit() {
    this.animationService.animationsListNeedRefresh.subscribe(() => {
      // console.log("event recu");
      this.refreshData();
    });
    this.refreshData();
  }

  refreshData() {
    this.animationService.getAnimationsList().then((anims) => {
      console.log("backend : "+anims);

      anims.forEach((name) => {
        // console.log(name);
        let anim = this.animations.find((a) => a.titre === name);
        if (!anim) {
          anim = new LedAnimationUploaded(name, this.animationService);
          this.animations.push(anim);
        }

        anim.existOnBackend = true;
      });
      this.animations = this.animations.filter((a) => {
        const name = anims.find((n) => a.titre === n);
        if (!name) {
          a.existOnBackend = false;
          if (!a.existOnTree && !a.calculate) {
            return false;
          }
          return true;
        } else {
          a.existOnBackend = true;
          return true;
        }
      });
    });
    this.ledsService.getAnimationsList().then((ret) => {
      console.log("strip : "+ret);

      if (typeof ret === 'string') {
        return;
      }
      const anims = ret;
      anims.forEach((name) => {
        // console.log(name);
        let anim = this.animations.find((a) => a.titre === name);
        if (!anim) {
          anim = new LedAnimationUploaded(name, this.animationService);
          this.animations.push(anim);
        }
        anim.existOnTree = true;
      });
      this.animations = this.animations.filter((a) => {
        const name = anims.find((n) => a.titre === n);
        if (!name) {
          a.existOnTree = false;
          if (!a.existOnBackend && !a.calculate) {
            return false;
          }
          return true;
        } else {
          a.existOnTree = true;
          return true;
        }
      });
    });
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

  shownOptions(options: LedAnimOption[], event: MouseEvent) {
    if (this.optionDiv) {
      this.optionDiv.nativeElement.style.left = event.clientX+"px";
      this.optionDiv.nativeElement.style.top  = event.clientY+"px";
    }
    this.optionHide = false;
    this.options = options;
  }
  hideOptions() {
    console.log(this.options);
    
    this.optionHide = true;
  }

}
