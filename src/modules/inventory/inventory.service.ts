import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entity/product.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entity/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private withAvailable<T extends Inventory>(inventory: T): T & { available: number } {
    return {
      ...inventory,
      available: inventory.stock - inventory.reserved,
    };
  }

  async create(
    createInventoryDto: CreateInventoryDto,
  ): Promise<Inventory & { available: number }> {
    const product = await this.productRepository.findOne({
      where: { id: createInventoryDto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${createInventoryDto.productId} not found`);
    }

    const inventory = this.inventoryRepository.create({
      stock: createInventoryDto.stock ?? 0,
      reserved: createInventoryDto.reserved ?? 0,
      product,
    });
    const savedInventory = await this.inventoryRepository.save(inventory);
    return this.withAvailable(savedInventory);
  }

  async findAll(): Promise<Array<Inventory & { available: number }>> {
    const inventories = await this.inventoryRepository.find({ relations: ['product'] });
    return inventories.map((inventory) => this.withAvailable(inventory));
  }

  async findOne(id: number): Promise<Inventory & { available: number }> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${id} not found`);
    return this.withAvailable(inventory);
  }

  async update(
    id: number,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory & { available: number }> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${id} not found`);

    if (updateInventoryDto.productId !== undefined) {
      const product = await this.productRepository.findOne({
        where: { id: updateInventoryDto.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${updateInventoryDto.productId} not found`);
      }
      inventory.product = product;
    }
    if (updateInventoryDto.stock !== undefined) {
      inventory.stock = updateInventoryDto.stock;
    }
    if (updateInventoryDto.reserved !== undefined) {
      inventory.reserved = updateInventoryDto.reserved;
    }

    const savedInventory = await this.inventoryRepository.save(inventory);
    return this.withAvailable(savedInventory);
  }

  async remove(id: number): Promise<void> {
    const result = await this.inventoryRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Inventory with ID ${id} not found`);
  }
}
