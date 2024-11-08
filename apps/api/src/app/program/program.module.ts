import { Module } from '@nestjs/common';
import { LedsModule } from '../leds/leds.module';
import { ProgramController } from './program.controller';
import { AnimationModule } from '../animation/animation.module';
import { StatusModule } from '../status/status.module';

@Module({
  controllers: [ProgramController],
  imports: [LedsModule, AnimationModule, StatusModule] 
})
export class ProgramModule {}
