import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { DatabaseModule } from './database/database.module';
import { DevTestModule } from './modules/dev-test/dev-test.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrderItemModule } from './modules/order-item/order-item.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductModule } from './modules/product/product.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 30,
      },
    ]),
    DatabaseModule,
    UserModule,
    ProductModule,
    InventoryModule,
    OrderModule,
    OrderItemModule,
    PaymentModule,
    // ...(process.env.NODE_ENV === 'development' ? [DevTestModule] : []),
    DevTestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
})
export class AppModule {}
