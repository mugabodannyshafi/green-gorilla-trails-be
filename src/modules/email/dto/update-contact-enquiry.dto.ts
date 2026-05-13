import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ContactEnquiryStatus } from '../../../database/entities/13_contact_enquiry.entity';

export class UpdateContactEnquiryDto {
  @ApiPropertyOptional({ enum: ContactEnquiryStatus, description: 'Mark enquiry as handled or new' })
  @IsOptional()
  @IsEnum(ContactEnquiryStatus, { message: 'Invalid status' })
  status?: ContactEnquiryStatus;
}
