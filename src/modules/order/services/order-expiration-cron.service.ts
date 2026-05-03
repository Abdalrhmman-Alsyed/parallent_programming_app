import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { Order } from '../entity/order.entity';
import { OrderService } from '../order.service';

@Injectable()
export class OrderExpirationCronService {
  private readonly logger = new Logger(OrderExpirationCronService.name);
  private static readonly BATCH_SIZE = 50;
  private static readonly CONCURRENCY = 8;
  private static readonly EXPIRATION_MINUTES = 30;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
  ) {}

  @Cron('*/10 * * * *')
  async handleCron(): Promise<void> {
    await this.cancelExpiredPendingOrders();
  }

  async cancelExpiredPendingOrders(): Promise<void> {
    this.logger.log('Order expiration cron started');

    const thresholdDate = new Date(
      Date.now() - OrderExpirationCronService.EXPIRATION_MINUTES * 60 * 1000,
    );

    const orders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PENDING,
        createdAt: LessThan(thresholdDate),
      },
      order: { createdAt: 'ASC' },
      take: OrderExpirationCronService.BATCH_SIZE,
    });

    this.logger.log(`Found ${orders.length} expired pending orders`);

    for (let i = 0; i < orders.length; i += OrderExpirationCronService.CONCURRENCY) {
      const chunk = orders.slice(i, i + OrderExpirationCronService.CONCURRENCY);
      const chunkNumber = Math.floor(i / OrderExpirationCronService.CONCURRENCY) + 1;
      this.logger.log(`Processing batch ${chunkNumber} with ${chunk.length} orders`);

      await Promise.all(
        chunk.map(async (order) => {
          try {
            await this.orderService.cancelOrder(order.id);
            this.logger.log(`Order ${order.id} cancelled successfully`);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to cancel order ${order.id}: ${message}`);
          }
        }),
      );
    }

    this.logger.log('Order expiration cron finished');
  }
}
