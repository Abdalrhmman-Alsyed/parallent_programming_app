import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { DevTestController } from './dev-test.controller';
import { DevTestService } from './dev-test.service';

@Module({
  imports: [OrderModule],
  controllers: [DevTestController],
  providers: [DevTestService],
})
export class DevTestModule {}
