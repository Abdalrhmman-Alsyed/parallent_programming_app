import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from '../inventory/entity/inventory.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entity/order.entity';
import { OrderExpirationCronService } from './services/order-expiration-cron.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, User, Product, Inventory])],
  controllers: [OrderController],
  providers: [OrderService, OrderExpirationCronService],
  exports: [OrderService, OrderExpirationCronService],
})
export class OrderModule {}
