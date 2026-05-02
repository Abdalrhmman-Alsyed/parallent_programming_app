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

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const product = await this.productRepository.findOne({
      where: { id: createInventoryDto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${createInventoryDto.productId} not found`);
    }

    const inventory = this.inventoryRepository.create({
      quantity: createInventoryDto.quantity ?? 0,
      product,
    });
    return this.inventoryRepository.save(inventory);
  }

  findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({ relations: ['product'] });
  }

  async findOne(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!inventory) throw new NotFoundException(`Inventory with ID ${id} not found`);
    return inventory;
  }

  async update(id: number, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    if (updateInventoryDto.productId !== undefined) {
      const product = await this.productRepository.findOne({
        where: { id: updateInventoryDto.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${updateInventoryDto.productId} not found`);
      }
      inventory.product = product;
    }
    if (updateInventoryDto.quantity !== undefined) {
      inventory.quantity = updateInventoryDto.quantity;
    }
    return this.inventoryRepository.save(inventory);
  }

  async remove(id: number): Promise<void> {
    const result = await this.inventoryRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Inventory with ID ${id} not found`);
  }
}
