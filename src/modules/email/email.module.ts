import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactController } from './contact.controller';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  controllers: [ContactController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
