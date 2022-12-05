import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { ImageModule } from './image/image.module';
import { LedsModule } from './leds/leds.module';
import { GeometryModule } from './geometry/geometry.module';
import { AnimationModule } from './animation/animation.module';

@Module({
  imports: [ImageModule, LedsModule, GeometryModule, AnimationModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
