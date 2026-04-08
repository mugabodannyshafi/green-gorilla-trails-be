import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Full name of the customer making the booking',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  names: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Preferred start date for the trip (ISO 8601)',
    example: '2026-05-10',
  })
  @IsDateString()
  prefferedDate: string;

  @ApiProperty({
    description: 'Number of days for the trip',
    example: 3,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numberOfDays: number;

  @ApiPropertyOptional({
    description: 'Additional message or special requests from the customer',
    example: 'We would like a mid-range lodge and vegetarian meals.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

