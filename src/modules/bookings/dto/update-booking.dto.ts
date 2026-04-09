import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus } from '../../../database/entities/14_booking.entity';

export class UpdateBookingDto {
  @ApiPropertyOptional({ enum: BookingStatus, description: 'Booking workflow status' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Internal special requests / notes' })
  @IsOptional()
  @IsString()
  special_requests?: string;

  @ApiPropertyOptional({ description: 'Customer-facing message on the booking' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Number of guests', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  number_of_guests?: number;
}
