import { Module } from '@nestjs/common';
import { DevTestController } from './dev-test.controller';
import { DevTestService } from './dev-test.service';

@Module({
  controllers: [DevTestController],
  providers: [DevTestService],
})
export class DevTestModule {}
