import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AnimationModule } from './animation/animation.module';
import { TreeComponent } from './tree/tree.component';
import { VisuComponent } from './visu.component';



@NgModule({
  declarations: [
    VisuComponent,
    TreeComponent
  ],
  imports: [
    CommonModule,
    AnimationModule
  ]
})
export class VisuModule { }
