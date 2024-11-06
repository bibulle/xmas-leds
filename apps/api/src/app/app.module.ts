import { Module } from '@nestjs/common';

import { AnimationModule } from './animation/animation.module';
import { AppController } from './app.controller';
import { GeometryModule } from './geometry/geometry.module';
import { ImageModule } from './image/image.module';
import { LedsModule } from './leds/leds.module';
import { ProgramModule } from './program/program.module';

@Module({
  imports: [ImageModule, LedsModule, GeometryModule, AnimationModule, ProgramModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
