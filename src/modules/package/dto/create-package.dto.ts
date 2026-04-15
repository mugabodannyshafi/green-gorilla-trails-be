import {
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PackageStatus } from '../../../database/entities/2_package.entity';
import { PackageAccommodationTier } from '../../../database/entities/17_package_accommodation_option.entity';
import { MealType } from '../../../database/entities/18_package_activity.entity';

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
  @Min(0)
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
  @Min(0)
  sort_order?: number;
}

export class CreatePackagePricingDto {
  @ApiProperty({
    enum: PackageAccommodationTier,
    description: 'Accommodation tier for this pricing row',
    example: PackageAccommodationTier.STANDARD,
  })
  @IsEnum(PackageAccommodationTier)
  tier: PackageAccommodationTier;

  @ApiProperty({
    description: 'Number of guests (2-6), nullable when is_single_supplement = true',
    required: false,
    example: 2,
  })
  @ValidateIf((o: CreatePackagePricingDto) => !o.is_single_supplement)
  @IsInt()
  @Min(1)
  pax?: number;

  @ApiProperty({
    description: 'Price value as decimal string',
    example: '1353.00',
  })
  @IsString()
  @IsNotEmpty()
  price: string;

  @ApiPropertyOptional({
    description: 'Whether this row is a single supplement (SSR)',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_single_supplement?: boolean;
}

export class CreatePackageActivityDto {
  @ApiProperty({
    description: 'Activity name',
    maxLength: 255,
    example: 'Kigali city tour',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class CreatePackageDayAccommodationDto {
  @ApiProperty({
    enum: PackageAccommodationTier,
    description: 'Accommodation tier (STANDARD | MIDRANGE | LUXURY)',
    example: PackageAccommodationTier.MIDRANGE,
  })
  @IsEnum(PackageAccommodationTier)
  tier: PackageAccommodationTier;

  @ApiProperty({
    description: 'Hotel/lodge name for this day and tier',
    maxLength: 255,
    example: 'Five Volcanoes Boutique Hotel',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class CreatePackageItineraryDayDto {
  @ApiProperty({
    description: 'Sequential day number in itinerary',
    minimum: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  day_number: number;

  @ApiProperty({
    description: 'Day title',
    maxLength: 255,
    example: 'Arrival in Kigali',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Day description',
    example: 'Pickup at Kigali airport and transfer to Musanze.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Included meals for the day',
    enum: MealType,
    isArray: true,
    example: [MealType.LUNCH, MealType.DINNER],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(MealType, { each: true })
  meals?: MealType[];

  @ApiPropertyOptional({
    type: [CreatePackageActivityDto],
    description: 'Structured list of activities (omit or use [] when none for this day)',
    example: [{ name: 'Drive to Volcanoes National Park' }],
    default: [],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageActivityDto)
  activities: CreatePackageActivityDto[];

  @ApiPropertyOptional({
    type: [CreatePackageDayAccommodationDto],
    description: 'Accommodation options for this day (omit or use [] when none)',
    default: [],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDayAccommodationDto)
  accommodations: CreatePackageDayAccommodationDto[];
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
    description: 'URL-friendly unique slug. If omitted, derived from title',
    maxLength: 255,
    example: '3-day-rwanda-gorilla-trekking',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Package overview text',
    example: 'A Rwanda safari experience with gorilla trekking and cultural highlights.',
  })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiProperty({
    description: 'Full package description',
    example: 'This 3-day adventure includes transfers, permits, and guided experiences.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Total duration of the package in days',
    minimum: 1,
    example: 3,
  })
  @IsInt()
  @Min(1)
  duration_days: number;

  @ApiProperty({
    description: 'Minimum pax supported by this package',
    minimum: 1,
    example: 2,
  })
  @IsInt()
  @Min(1)
  min_pax: number;

  @ApiProperty({
    description: 'Maximum pax supported by this package',
    minimum: 1,
    example: 6,
  })
  @IsInt()
  @Min(1)
  max_pax: number;

  @ApiProperty({
    description: 'Travel year this pricing applies to',
    minimum: 2024,
    example: 2026,
  })
  @IsInt()
  @Min(2024)
  travel_year: number;

  @ApiProperty({
    description: 'Starting price per person (decimal string)',
    example: '2500.00',
  })
  @IsString()
  @IsNotEmpty()
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

  @ApiProperty({
    type: [CreatePackagePricingDto],
    description: 'Tier/pax pricing rows including optional SSR rows',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePackagePricingDto)
  pricing: CreatePackagePricingDto[];

  @ApiProperty({
    type: [CreatePackageItineraryDayDto],
    description: 'Day-by-day itinerary',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => CreatePackageItineraryDayDto)
  itinerary: CreatePackageItineraryDayDto[];
}
