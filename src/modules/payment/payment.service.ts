import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { Inventory } from '../inventory/entity/inventory.entity';
import { Order } from '../order/entity/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Payment } from './entity/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({
        where: { id: createPaymentDto.orderId },
      });
      if (!order) throw new NotFoundException(`Order with ID ${createPaymentDto.orderId} not found`);

      const payment = manager.getRepository(Payment).create({
        order,
        amount: createPaymentDto.amount.toFixed(2),
        method: createPaymentDto.method,
      });
      return manager.getRepository(Payment).save(payment);
    });
  }

  findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({ relations: ['order'] });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async update(id: number, updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.getRepository(Payment).findOne({
        where: { id },
        relations: ['order', 'order.items', 'order.items.product'],
      });
      if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);

      const nextStatus = updatePaymentStatusDto.status;
      if (payment.status !== nextStatus) {
        const productIds = [...new Set(payment.order.items.map((item) => item.product.id))];
        if (productIds.length > 0) {
          const inventories = await manager
            .getRepository(Inventory)
            .createQueryBuilder('inventory')
            .setLock('pessimistic_write')
            .where('inventory.product_id IN (:...productIds)', { productIds })
            .getMany();

          const inventoryByProductId = new Map(
            inventories.map((inventory) => [inventory.productId, inventory]),
          );

          for (const item of payment.order.items) {
            const inventory = inventoryByProductId.get(item.product.id);
            if (!inventory) {
              throw new NotFoundException(`Inventory for product ID ${item.product.id} not found`);
            }

            if (nextStatus === PaymentStatus.PAID) {
              inventory.reserved = Math.max(0, inventory.reserved - item.quantity);
              inventory.stock = Math.max(0, inventory.stock - item.quantity);
            }

            if (nextStatus === PaymentStatus.FAILED || nextStatus === PaymentStatus.REFUNDED) {
              inventory.reserved = Math.max(0, inventory.reserved - item.quantity);
            }
          }

          await manager.getRepository(Inventory).save(inventories);
        }
      }

      payment.status = nextStatus;
      return manager.getRepository(Payment).save(payment);
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.paymentRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Payment with ID ${id} not found`);
  }
}
