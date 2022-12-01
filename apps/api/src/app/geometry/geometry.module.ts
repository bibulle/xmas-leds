import { Module } from '@nestjs/common';
import { GeometryController } from './geometry.controller';

@Module({
  controllers: [GeometryController],
})
export class GeometryModule {}
