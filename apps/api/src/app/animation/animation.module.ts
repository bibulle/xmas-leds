import { Module } from '@nestjs/common';
import { LedsModule } from '../leds/leds.module';
import { AnimationController } from './animation.controller';
import { AnimationService } from './animation.service';

@Module({
  controllers: [AnimationController],
  imports: [LedsModule],
  exports: [AnimationService],
  providers: [AnimationService] 
})
export class AnimationModule {}
