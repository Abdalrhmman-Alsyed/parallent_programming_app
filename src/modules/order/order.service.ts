import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Inventory } from '../inventory/entity/inventory.entity';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entity/order.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({
        where: { id: createOrderDto.userId },
      });
      if (!user) throw new NotFoundException(`User with ID ${createOrderDto.userId} not found`);

      const productIds = createOrderDto.items.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)];
      const products = await manager.getRepository(Product).find({
        where: { id: In(uniqueProductIds) },
      });

      if (products.length !== uniqueProductIds.length) {
        const foundIds = new Set(products.map((product) => product.id));
        const missingId = uniqueProductIds.find((id) => !foundIds.has(id));
        throw new NotFoundException(`Product with ID ${missingId} not found`);
      }

      const inventories = await manager
        .getRepository(Inventory)
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .setLock('pessimistic_write')
        .where('inventory.product_id IN (:...productIds)', { productIds: uniqueProductIds })
        .getMany();

      if (inventories.length !== uniqueProductIds.length) {
        const foundInventoryIds = new Set(inventories.map((inventory) => inventory.productId));
        const missingInventoryProductId = uniqueProductIds.find(
          (productId) => !foundInventoryIds.has(productId),
        );
        throw new NotFoundException(
          `Inventory for product ID ${missingInventoryProductId} not found`,
        );
      }

      const inventoryByProductId = new Map(
        inventories.map((inventory) => [inventory.productId, inventory]),
      );
      const productById = new Map(products.map((product) => [product.id, product]));

      for (const line of createOrderDto.items) {
        const inventory = inventoryByProductId.get(line.productId)!;
        const available = inventory.stock - inventory.reserved;
        if (available < line.quantity) {
          throw new NotFoundException(`Insufficient available stock for product ID ${line.productId}`);
        }
        inventory.reserved += line.quantity;
      }

      await manager.getRepository(Inventory).save(inventories);

      const items = createOrderDto.items.map((line) => {
        const item = new OrderItem();
        item.product = productById.get(line.productId)!;
        item.quantity = line.quantity;
        item.unitPriceAtPurchase = item.product.price;
        return item;
      });

      const totalAmount = items.reduce((sum, item) => {
        return sum + Number(item.unitPriceAtPurchase) * item.quantity;
      }, 0);

      const order = manager.getRepository(Order).create({
        user,
        totalAmount: totalAmount.toFixed(2),
        items,
      });

      return manager.getRepository(Order).save(order);
    });
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product', 'payment'],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'payment'],
    });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async update(id: number, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = updateOrderStatusDto.status;
    return this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const result = await this.orderRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Order with ID ${id} not found`);
  }
}
