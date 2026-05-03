import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailDto } from './email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async test(@Body() dto: EmailDto) {
    await this.emailService.sendTestEmail(dto);
    return 'Sending email...';
  }
}
