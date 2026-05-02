import { IsEnum, IsInt, IsNumber } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @IsInt()
  orderId!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
