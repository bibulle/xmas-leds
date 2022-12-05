import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisuComponent } from './visu.component';
import { TreeComponent } from './tree/tree.component';
import { AnimationModule } from './animation/animation.module';



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
