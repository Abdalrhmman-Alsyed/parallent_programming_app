import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/entity/product.entity';

@Entity({ name: 'inventories' })
export class Inventory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', default: 0 })
  stock!: number;

  @Column({ type: 'integer', default: 0 })
  reserved!: number;

  @Column({ name: 'product_id', type: 'integer', unique: true })
  productId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => Product, (product) => product.inventory)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  get available(): number {
    return this.stock - this.reserved;
  }
}
