import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from '../../database/entities/2_package.entity';
import { Destination } from '../../database/entities/3_destination.entity';
import { PackageInclusion } from '../../database/entities/7_package_inclusion.entity';
import { PackageExclusion } from '../../database/entities/8_package_exclusion.entity';
import { PackageGalleryImage } from '../../database/entities/4_package_gallery_image.entity';
import { PackageItineraryDay } from '../../database/entities/5_package_itinerary_day.entity';
import { PackagePricing } from '../../database/entities/16_package_pricing.entity';
import { PackageAccommodationOption } from '../../database/entities/17_package_accommodation_option.entity';
import { PackageActivity } from '../../database/entities/18_package_activity.entity';
import { PackageController } from './package.controller';
import { PackageService } from './package.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Package,
      Destination,
      PackageInclusion,
      PackageExclusion,
      PackageGalleryImage,
      PackageItineraryDay,
      PackagePricing,
      PackageAccommodationOption,
      PackageActivity,
    ]),
  ],
  controllers: [PackageController],
  providers: [PackageService],
  exports: [PackageService],
})
export class PackageModule {}
