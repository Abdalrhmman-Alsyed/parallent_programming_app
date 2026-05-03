import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { OrderItem } from '../order-item/entity/order-item.entity';
import { Product } from '../product/entity/product.entity';
import { User } from '../user/entity/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entity/order.entity';
import { Inventory } from '../inventory/entity/inventory.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
  ) {}

  async createUnsafe(dto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException();

    const productIds = dto.items.map((i) => i.productId);

    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['inventory'],
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product) throw new NotFoundException();

      if (product.inventory.stock < item.quantity) {
        throw new Error('Out of stock');
      }
      product.inventory.stock -= item.quantity;
      product.inventory.reserved += item.quantity;

      await this.inventoryRepository.save(product.inventory);
    }

    const orderItems = dto.items.map((i) => {
      const oi = new OrderItem();
      oi.product = productMap.get(i.productId)!;
      oi.quantity = i.quantity;
      oi.unitPriceAtPurchase = oi.product.price;
      return oi;
    });

    const total = dto.items.reduce((sum, i) => {
      const product = productMap.get(i.productId)!;
      return sum + Number(product.price) * i.quantity;
    }, 0);

    const order = this.orderRepository.create({
      user,
      items: orderItems,
      totalAmount: total.toFixed(2),
    });

    return this.orderRepository.save(order);
  }
  async createSafe(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: dto.userId },
      });

      if (!user) throw new NotFoundException();

      const productIds = dto.items.map((i) => i.productId);

      const products = await manager.find(Product, {
        where: { id: In(productIds) },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      const inventories = await manager
        .createQueryBuilder(Inventory, 'inventory')
        .where('inventory.product_id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write')
        .getMany();

      const inventoryMap = new Map(
        inventories.map((inv) => [inv.productId, inv]),
      );

      for (const item of dto.items) {
        const inventory = inventoryMap.get(item.productId);

        if (!inventory) throw new NotFoundException();

        if (inventory.stock < item.quantity) {
          throw new Error(`Product ${item.productId} out of stock`);
        }

        inventory.stock -= item.quantity;
        inventory.reserved += item.quantity;

        await manager.save(inventory);
      }

      const orderItems = dto.items.map((i) => {
        const product = productMap.get(i.productId)!;

        const oi = new OrderItem();
        oi.product = product;
        oi.quantity = i.quantity;
        oi.unitPriceAtPurchase = product.price;

        return oi;
      });

      const total = orderItems.reduce(
        (sum, i) => sum + Number(i.unitPriceAtPurchase) * i.quantity,
        0,
      );

      const order = manager.create(Order, {
        user,
        items: orderItems,
        totalAmount: total.toFixed(2),
      });

      return manager.save(order);
    });
  }
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({
      where: { id: createOrderDto.userId },
    });
    if (!user)
      throw new NotFoundException(
        `User with ID ${createOrderDto.userId} not found`,
      );

    const productIds = createOrderDto.items.map((item) => item.productId);
    const uniqueProductIds = [...new Set(productIds)];
    const products = await this.productRepository.find({
      where: { id: In(uniqueProductIds) },
    });

    if (products.length !== uniqueProductIds.length) {
      const foundIds = new Set(products.map((product) => product.id));
      const missingId = uniqueProductIds.find((id) => !foundIds.has(id));
      throw new NotFoundException(`Product with ID ${missingId} not found`);
    }

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
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

  async update(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);
    order.status = updateOrderStatusDto.status;
    return this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Cannot delete order');
      }

      // 2) جلب العناصر بدون lock
      const items = await manager.find(OrderItem, {
        where: { order: { id } },
        relations: ['product'],
      });

      if (items.length === 0) {
        throw new BadRequestException('Order has no items');
      }

      const productIds = items.map((i) => i.product.id);

      // 3) اقفل الـ Inventory
      const inventories = await manager
        .createQueryBuilder(Inventory, 'inventory')
        .where('inventory.product_id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write')
        .getMany();

      const inventoryMap = new Map(
        inventories.map((inv) => [inv.productId, inv]),
      );

      // 4) تحديث المخزون (فك الحجز)
      for (const item of items) {
        const inventory = inventoryMap.get(item.product.id);

        if (!inventory) {
          throw new NotFoundException(
            `Inventory not found for product ${item.product.id}`,
          );
        }

        if (inventory.reserved < item.quantity) {
          throw new BadRequestException(
            'Inventory inconsistent (reserved أقل من المطلوب)',
          );
        }

        inventory.stock += item.quantity;
        inventory.reserved -= item.quantity;

        await manager.save(inventory);
      }

      // 5) تحديث حالة الطلب
      order.status = OrderStatus.DELETED;
      await manager.save(order);
    });
  }
}
