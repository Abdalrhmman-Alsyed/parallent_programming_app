import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reserved?: number;

  @IsInt()
  productId!: number;
}
