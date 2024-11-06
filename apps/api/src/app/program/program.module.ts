import { Module } from '@nestjs/common';
import { LedsModule } from '../leds/leds.module';
import { ProgramController } from './program.controller';
import { AnimationModule } from '../animation/animation.module';

@Module({
  controllers: [ProgramController],
  imports: [LedsModule, AnimationModule] 
})
export class ProgramModule {}
