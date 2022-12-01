import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyseComponent } from './analyse.component';
import { WebcamModule } from 'ngx-webcam';
import { FormsModule } from '@angular/forms';
import { CaptureComponent } from './capture/capture.component';

@NgModule({
  declarations: [AnalyseComponent, CaptureComponent],
  imports: [CommonModule, WebcamModule, FormsModule],
})
export class AnalyseModule {}
