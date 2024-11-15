import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { ColorPickerModule } from 'ngx-color-picker';
import { AnimationEditorComponent } from './animation-editor/animation-editor.component';
import { MatButtonModule } from '@angular/material/button';
import { MAT_COLOR_FORMATS, MatColorFormats, NgxMatColorPickerModule } from '@angular-material-components/color-picker';
import { AnimationDisplayComponent } from './animation-display/animation-display.component';
import { MatIconModule } from '@angular/material/icon';
import { PixelCanvasComponent } from './pixel-canvas/pixel-canvas.component';

export const HEX_MAT_COLOR_FORMATS: MatColorFormats = {
  display: {
      colorInput: 'hex'
  }
}
@NgModule({
  declarations: [AnimationEditorComponent, AnimationDisplayComponent, PixelCanvasComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ColorPickerModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, NgxMatColorPickerModule, MatExpansionModule, MatIconModule],
  exports: [AnimationEditorComponent, AnimationDisplayComponent],
  providers: [{ provide: MAT_COLOR_FORMATS, useValue: HEX_MAT_COLOR_FORMATS }],
})
export class AnimationModule {}

