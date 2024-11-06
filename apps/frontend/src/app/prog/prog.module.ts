import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AnimationModule } from '../animation/animation.module';
import { TreeModule } from '../tree/tree.module';
import { ProgComponent } from './prog.component';



@NgModule({
  declarations: [
    ProgComponent
  ],
  imports: [
    CommonModule,
    TreeModule,
    AnimationModule
  ]
})
export class ProgModule { }
