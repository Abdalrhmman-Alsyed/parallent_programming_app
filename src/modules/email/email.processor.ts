import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

type EmailJob = {
  to: string;
  subject: string;
  body: string;
};

@Processor('email', {
  concurrency: 3,
})
export class EmailProcessor extends WorkerHost {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'skinani225@gmail.com',
      pass: 'yzqz vqhb  yamf lgbd',
      // user: process.env.SMTP_USER,
      // pass: process.env.SMTP_PASS,
    },
  });

  async process(job: Job<EmailJob>) {
    console.log('PROCESSOR STARTED:', job.name, job.data);

    const { to, subject, body } = job.data;

    try {
      await this.transporter.sendMail({
        from: '"App" <no-reply@app.com>',
        to,
        subject,
        text: body,
      });

      console.log('Email sent to:', to);
    } catch (error) {
      console.error('Email failed:', error);
      throw error; // for retry
    }
  }
}
