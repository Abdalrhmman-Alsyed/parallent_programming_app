import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        retryAttempts: 10,
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          statement_timeout: 5000,
        },
        retryDelay: 3000,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [],
  controllers: [],
})
export class DatabaseModule {}
