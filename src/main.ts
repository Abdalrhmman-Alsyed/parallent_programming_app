import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (process.env.NODE_ENV === 'development') {
    Logger.log(`UV_THREADPOOL_SIZE: ${process.env.UV_THREADPOOL_SIZE ?? 'not-set'}`, 'Bootstrap');
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
/**
 * 
 * سيف ما بقتنع الا لما يشوف الكود شغال 
 *
 */
