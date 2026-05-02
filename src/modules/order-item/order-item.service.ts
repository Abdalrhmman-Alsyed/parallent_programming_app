import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../order/entity/order.entity';
import { Product } from '../product/entity/product.entity';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItem } from './entity/order-item.entity';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto): Promise<OrderItem> {
    const order = await this.orderRepository.findOne({ where: { id: createOrderItemDto.orderId } });
    if (!order) throw new NotFoundException(`Order with ID ${createOrderItemDto.orderId} not found`);

    const product = await this.productRepository.findOne({ where: { id: createOrderItemDto.productId } });
    if (!product) throw new NotFoundException(`Product with ID ${createOrderItemDto.productId} not found`);

    const orderItem = this.orderItemRepository.create({
      order,
      product,
      quantity: createOrderItemDto.quantity,
      unitPriceAtPurchase: product.price,
    });
    return this.orderItemRepository.save(orderItem);
  }

  findAll(): Promise<OrderItem[]> {
    return this.orderItemRepository.find({ relations: ['order', 'product'] });
  }

  async findOne(id: number): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'product'],
    });
    if (!orderItem) throw new NotFoundException(`Order item with ID ${id} not found`);
    return orderItem;
  }

  async update(id: number, updateOrderItemDto: UpdateOrderItemDto): Promise<OrderItem> {
    const orderItem = await this.findOne(id);

    if (updateOrderItemDto.orderId !== undefined) {
      const order = await this.orderRepository.findOne({ where: { id: updateOrderItemDto.orderId } });
      if (!order) throw new NotFoundException(`Order with ID ${updateOrderItemDto.orderId} not found`);
      orderItem.order = order;
    }

    if (updateOrderItemDto.productId !== undefined) {
      const product = await this.productRepository.findOne({
        where: { id: updateOrderItemDto.productId },
      });
      if (!product) throw new NotFoundException(`Product with ID ${updateOrderItemDto.productId} not found`);
      orderItem.product = product;
      orderItem.unitPriceAtPurchase = product.price;
    }

    if (updateOrderItemDto.quantity !== undefined) {
      orderItem.quantity = updateOrderItemDto.quantity;
    }

    return this.orderItemRepository.save(orderItem);
  }

  async remove(id: number): Promise<void> {
    const result = await this.orderItemRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Order item with ID ${id} not found`);
  }
}
