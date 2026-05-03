import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrderExpirationCronService } from '../order/services/order-expiration-cron.service';

@Injectable()
export class DevTestService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly orderExpirationCronService: OrderExpirationCronService,
  ) {}

  async triggerHttpDelay(): Promise<{ message: string }> {
    // Development testing only: intentionally exceed global HTTP timeout.
    await new Promise((resolve) => setTimeout(resolve, 12000));
    return { message: 'This response should not be returned due to HTTP timeout' };
  }

  async triggerDbTimeout(): Promise<{ message: string; dbTimeoutTriggered: boolean }> {
    try {
      // Development testing only: should exceed PostgreSQL statement_timeout (10s).
      await this.dataSource.query('SELECT pg_sleep(12)');
      return {
        message: 'DB timeout did not trigger (check statement_timeout configuration)',
        dbTimeoutTriggered: false,
      };
    } catch {
      return {
        message: 'Database statement timeout triggered',
        dbTimeoutTriggered: true,
      };
    }
  }

  async getDbConnections(): Promise<{ activeConnections: number; message: string }> {
    const result: Array<{ count: number }> = await this.dataSource.query(`
      SELECT count(*)::int AS count
      FROM pg_stat_activity
      WHERE datname = current_database();
    `);

    return {
      activeConnections: result[0]?.count ?? 0,
      message: 'Current database connection count',
    };
  }

  async runDbPingQuery(): Promise<{ message: string }> {
    // await this.dataSource.query('SELظECT 1');
    await this.dataSource.query('SELECT pg_sleep(5)');
    return { message: 'Database query executed' };
  }

  async runCancelExpiredPendingOrdersTest(): Promise<{ message: string }> {
    await this.orderExpirationCronService.cancelExpiredPendingOrders();
    return { message: 'Expired pending orders cancellation triggered' };
  }
}
