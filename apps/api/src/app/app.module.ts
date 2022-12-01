import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { ImageModule } from './image/image.module';
import { LedsModule } from './leds/leds.module';
import { GeometryModule } from './geometry/geometry.module';

@Module({
  imports: [ImageModule, LedsModule, GeometryModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
