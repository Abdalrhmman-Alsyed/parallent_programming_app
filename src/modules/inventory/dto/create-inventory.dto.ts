import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsInt()
  productId!: number;
}
