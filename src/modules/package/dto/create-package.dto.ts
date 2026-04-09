import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PackageStatus } from '../../../database/entities/2_package.entity';
import { AccommodationTier } from '../../../database/entities/6_package_day_accommodation.entity';

export class CreatePackageInclusionDto {
  @ApiProperty({
    description: 'Inclusion text',
    example: 'Volcanoes National Park permit and entry fees',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Display order (lower first)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sort_order?: number;
}

export class CreatePackageExclusionDto {
  @ApiProperty({
    description: 'Exclusion text',
    example: 'International flights to/from Kigali',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Display order (lower first)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sort_order?: number;
}

export class CreatePackageDayAccommodationDto {
  @ApiProperty({
    enum: AccommodationTier,
    description: 'Accommodation tier (MIDRANGE | LUXURY | HIGH_END)',
    example: AccommodationTier.LUXURY,
  })
  @IsEnum(AccommodationTier)
  tier: AccommodationTier;

  @ApiProperty({
    description: 'Name of the lodge or camp',
    maxLength: 255,
    example: 'Bisate Lodge',
  })
  @IsString()
  @MaxLength(255)
  name: string;
}

export class CreatePackageItineraryDayDto {
  @ApiProperty({
    description: 'Sequential day number in the itinerary',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  day_number: number;

  @ApiProperty({
    description: 'Day heading',
    maxLength: 255,
    example: 'Arrival in Kigali & transfer to Volcanoes National Park',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Full description of the day’s activities',
    example:
      'Meet at Kigali International Airport. Drive to Musanze with optional cultural stop. Briefing at park headquarters. Overnight near the park.',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Meals included this day',
    example: 'Lunch, Dinner',
  })
  @IsOptional()
  @IsString()
  meals_text?: string;

  @ApiPropertyOptional({
    type: [CreatePackageDayAccommodationDto],
    description: 'Lodges or camps for this night (by tier)',
    example: [{ tier: 'LUXURY', name: 'Bisate Lodge' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDayAccommodationDto)
  accommodations?: CreatePackageDayAccommodationDto[];
}

export class CreatePackageDto {
  @ApiProperty({
    description: 'ID of the destination this package belongs to (must exist)',
    example: 1,
  })
  @IsNumber()
  destination_id: number;

  @ApiProperty({
    description: 'Package title',
    maxLength: 255,
    example: '3-Day Rwanda Gorilla Trekking Experience',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'URL-friendly unique slug. If omitted, derived from title.',
    maxLength: 255,
    example: '3-day-rwanda-gorilla-trekking',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Brief tagline or summary',
    maxLength: 255,
    example: 'Track mountain gorillas in Volcanoes National Park with expert guides.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  short_description?: string;

  @ApiProperty({
    description: 'Full package description (supports multi-paragraph text)',
    example:
      'This 3-day adventure takes you into Volcanoes National Park for an unforgettable encounter with mountain gorillas. Includes permits, accommodation, transfers from Kigali, and full board. Ideal for wildlife enthusiasts and first-time visitors to Rwanda.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Total duration of the package in days',
    minimum: 1,
    example: 3,
  })
  @IsNumber()
  @Min(1)
  duration_days: number;

  @ApiPropertyOptional({
    description: 'Physical difficulty (e.g. Moderate, Challenging)',
    maxLength: 50,
    example: 'Moderate',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  difficulty_level?: string;

  @ApiProperty({
    description: 'Starting price per person (decimal string)',
    example: '2500.00',
  })
  @IsString()
  base_price: string;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    default: 'USD',
    maxLength: 3,
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    enum: PackageStatus,
    description: 'Publication status',
    default: PackageStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @ApiPropertyOptional({
    type: [CreatePackageInclusionDto],
    description: 'What is included in the package',
    example: [
      { text: 'Gorilla permit and park fees', sort_order: 1 },
      { text: 'Full board accommodation', sort_order: 2 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageInclusionDto)
  inclusions?: CreatePackageInclusionDto[];

  @ApiPropertyOptional({
    type: [CreatePackageExclusionDto],
    description: 'What is not included',
    example: [
      { text: 'International flights', sort_order: 1 },
      { text: 'Travel insurance', sort_order: 2 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageExclusionDto)
  exclusions?: CreatePackageExclusionDto[];

  @ApiPropertyOptional({
    type: [CreatePackageItineraryDayDto],
    description: 'Day-by-day itinerary',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageItineraryDayDto)
  itinerary_days?: CreatePackageItineraryDayDto[];
}
