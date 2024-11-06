import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyzeComponent } from './analyse.component';
import { WebcamModule } from 'ngx-webcam';
import { FormsModule } from '@angular/forms';
import { CaptureComponent } from './capture/capture.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  declarations: [AnalyzeComponent, CaptureComponent],
  imports: [CommonModule, WebcamModule, FormsModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatCardModule, MatGridListModule, MatCheckboxModule],
})
export class AnalyseModule {}
