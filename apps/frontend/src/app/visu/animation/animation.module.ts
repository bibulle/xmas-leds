import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationComponent } from './animation.component';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  declarations: [AnimationComponent],
  imports: [CommonModule, FormsModule, ColorPickerModule],
  exports: [AnimationComponent],
})
export class AnimationModule {}
