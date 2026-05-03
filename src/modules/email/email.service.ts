import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailDto } from './email.dto';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendTestEmail(dto: EmailDto) {
    await this.emailQueue.add(
      'send-email',
      {
        to: dto.email,
        subject: dto.subject,
        body: dto.body,
      },
      {
        attempts: 3,
        delay: 2000,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }
}
