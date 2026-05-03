import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }
  @Post('safe')
  createSafe(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createSafe(createOrderDto);
  }
  @Post('unsafe')
  createUnsafe(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createUnsafe(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.update(Number(id), updateOrderStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(Number(id));
  }
}
