import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TreeModule } from '../tree/tree.module';
import { AnimationModule } from '../animation/animation.module';
import { VisuComponent } from './visu.component';



@NgModule({
  declarations: [
    VisuComponent
  ],
  imports: [
    CommonModule,
    AnimationModule,
    TreeModule
  ]
})
export class VisuModule { }
