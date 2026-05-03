import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventories')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Post('safe')
  createSaif(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createSafeMode(createInventoryDto);
  }
  @Post('unsafe')
  createUnSafe(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createUnSafeMode(createInventoryDto);
  }

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(Number(id), updateInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(Number(id));
  }
}
