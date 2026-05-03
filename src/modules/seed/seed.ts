import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module'; // تأكد من صحة مسار AppModule
import { DataSource } from 'typeorm';
import { Product } from '../product/entity/product.entity';
import { Inventory } from '../inventory/entity/inventory.entity';

// 1. منطق الـ Seeding الذي كتبناه (الـ Transaction)
async function seed(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🚀 Starting Enterprise Seeding...');

    const productsData = Array.from({ length: 50 }).map((_, index) => ({
      name: `Product ${index + 1}`,
      price: (Math.floor(Math.random() * 1000) + 100).toString(),
    }));

    const productInsertResult = await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Product)
      .values(productsData)
      .returning(['id'])
      .execute();

    const insertedProducts = productInsertResult.generatedMaps;

    const inventoriesData = insertedProducts.map((product) => ({
      product_id: product.id,
      stock: 100,
      reserved: 0,
    }));

    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Inventory)
      .values(inventoriesData)
      .execute();

    await queryRunner.commitTransaction();
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error(
      '❌ Seeding failed! Rolling back transaction...',
      error.message,
    );
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// 2. نقطة الدخول (Entry Point) للسكربت
async function bootstrap() {
  console.log('⏳ Bootstrapping NestJS Application Context for Seeding...');

  // إنشاء سياق التطبيق بدون تشغيل سيرفر الويب (Standalone Context)
  const app = await NestFactory.createApplicationContext(AppModule);

  // استخراج DataSource من بيئة NestJS لضمان استخدام نفس إعدادات التطبيق
  const dataSource = app.get(DataSource);

  try {
    await seed(dataSource);
  } catch (error) {
    console.error('❌ Fatal Error during seeding process.');
    process.exit(1); // إغلاق العملية برمز خطأ لتنبيه أنظمة الـ CI/CD
  } finally {
    console.log('🧹 Closing NestJS Context...');
    await app.close();
    process.exit(0); // إغلاق العملية بنجاح
  }
}

// 3. تشغيل السكربت
bootstrap();
