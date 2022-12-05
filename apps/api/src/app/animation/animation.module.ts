import { Module } from '@nestjs/common';
import { LedsModule } from '../leds/leds.module';
import { AnimationController } from './animation.controller';

@Module({
  controllers: [AnimationController],
  imports: [LedsModule] 
})
export class AnimationModule {}
