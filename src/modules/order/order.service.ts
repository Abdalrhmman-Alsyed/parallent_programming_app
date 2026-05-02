import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entity/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: createOrderDto.userId } });
    if (!user) throw new NotFoundException(`User with ID ${createOrderDto.userId} not found`);

    const productIds = createOrderDto.items.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];
    const products = await this.productRepository.find({ where: { id: In(uniqueProductIds) } });

    if (products.length !== uniqueProductIds.length) {
      const foundIds = new Set(products.map((product) => product.id));
      const missingId = uniqueProductIds.find((id) => !foundIds.has(id));
      throw new NotFoundException(`Product with ID ${missingId} not found`);
    }

    const productById = new Map(products.map((product) => [product.id, product]));
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

    const order = this.orderRepository.create({
      user,
      totalAmount: totalAmount.toFixed(2),
      items,
    });

    return this.orderRepository.save(order);
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
