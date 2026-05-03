import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DevTestService } from './dev-test.service';

// Development testing only endpoints. Module is registered only in development mode.
@Controller('dev-test')
export class DevTestController {
  constructor(private readonly devTestService: DevTestService) {}

  @Get('rate-limit')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  getRateLimitTest() {
    return { message: 'Rate limit test endpoint' };
  }

  @Get('http-timeout')
  async getHttpTimeoutTest() {
    return this.devTestService.triggerHttpDelay();
  }

  @Get('db-timeout')
  async getDbTimeoutTest() {
    return this.devTestService.triggerDbTimeout();
  }

  @Get('db-connections')
  async getDbConnections() {
    return this.devTestService.getDbConnections();
  }

  @Get('db-query')
  async runDbQuery() {
    return this.devTestService.runDbPingQuery();
  }
}
