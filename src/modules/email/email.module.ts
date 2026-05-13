import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEnquiry } from '../../database/entities/13_contact_enquiry.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([ContactEnquiry])],
  controllers: [ContactController],
  providers: [EmailService, ContactService],
  exports: [EmailService],
})
export class EmailModule {}
