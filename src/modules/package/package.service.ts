import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, FindOptionsWhere, In } from 'typeorm';
import { DateTime } from 'luxon';
import { Package, PackageStatus } from '../../database/entities/2_package.entity';
import { Destination } from '../../database/entities/3_destination.entity';
import { PackageInclusion } from '../../database/entities/7_package_inclusion.entity';
import { PackageExclusion } from '../../database/entities/8_package_exclusion.entity';
import { PackageGalleryImage } from '../../database/entities/4_package_gallery_image.entity';
import { PackageItineraryDay } from '../../database/entities/5_package_itinerary_day.entity';
import { PackagePricing } from '../../database/entities/16_package_pricing.entity';
import { PackageActivity } from '../../database/entities/18_package_activity.entity';
import { PackageDayAccommodation } from '../../database/entities/6_package_day_accommodation.entity';
import { Booking } from '../../database/entities/14_booking.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { v2 as cloudinary } from 'cloudinary';
import { BaseService, PaginationData, PaginationResponse } from '@rwanda360/rwanda360-service-sdk';

export interface PackageStatistics {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

@Injectable()
export class PackageService extends BaseService {
  private cloudinaryConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
  ) {
    super();
  }

  async createPackage(dto: CreatePackageDto): Promise<Package> {
    return this.entityManager.transaction(async (manager) => {
      const destination = await manager.findOne(Destination, {
        where: { id: dto.destination_id },
      });
      if (!destination) {
        throw new BadRequestException('Destination not found');
      }

      const slug = await this.resolveSlug(
        manager,
        dto.slug?.trim() || this.slugFromTitle(dto.title),
      );

      const pkg = manager.create(Package, {
        destination_id: dto.destination_id,
        title: dto.title,
        slug,
        description: dto.description,
        overview: dto.overview ?? null,
        featured_image: null,
        duration_days: dto.duration_days,
        min_pax: dto.min_pax,
        max_pax: dto.max_pax,
        travel_year: dto.travel_year,
        base_price: dto.base_price,
        currency: dto.currency ?? 'USD',
        status: dto.status ?? PackageStatus.DRAFT,
      });
      const savedPackage = await manager.save(Package, pkg);

      if (dto.min_pax > dto.max_pax) {
        throw new BadRequestException('min_pax cannot be greater than max_pax');
      }

      const pricingRows = (dto.pricing ?? []).map((row) =>
        manager.create(PackagePricing, {
          package_id: savedPackage.id,
          tier: row.tier,
          pax: row.is_single_supplement ? null : row.pax,
          price: row.price,
          is_single_supplement: row.is_single_supplement ?? false,
        }),
      );
      if (pricingRows.length > 0) {
        await manager.save(PackagePricing, pricingRows);
      }

      const dayEntities = (dto.itinerary ?? []).map((dayDto) =>
        manager.create(PackageItineraryDay, {
          package_id: savedPackage.id,
          day_number: dayDto.day_number,
          title: dayDto.title,
          description: dayDto.description,
          meals: dayDto.meals ?? null,
        }),
      );
      const savedDays =
        dayEntities.length > 0 ? await manager.save(PackageItineraryDay, dayEntities) : [];

      const activities: PackageActivity[] = [];
      for (let i = 0; i < savedDays.length; i++) {
        const dayDto = dto.itinerary[i];
        for (const activityDto of dayDto.activities) {
          activities.push(
            manager.create(PackageActivity, {
              itinerary_day_id: savedDays[i].id,
              name: activityDto.name,
            }),
          );
        }
      }
      if (activities.length > 0) {
        await manager.save(PackageActivity, activities);
      }

      const accommodations: PackageDayAccommodation[] = [];
      for (let i = 0; i < savedDays.length; i++) {
        const dayDto = dto.itinerary[i];
        for (const accommodationDto of dayDto.accommodations) {
          accommodations.push(
            manager.create(PackageDayAccommodation, {
              itinerary_day_id: savedDays[i].id,
              tier: accommodationDto.tier,
              name: accommodationDto.name,
            }),
          );
        }
      }
      if (accommodations.length > 0) {
        await manager.save(PackageDayAccommodation, accommodations);
      }

      const inclusions = (dto.inclusions ?? []).map((inc, index) =>
        manager.create(PackageInclusion, {
          package_id: savedPackage.id,
          text: inc.text,
          sort_order: inc.sort_order ?? index,
        }),
      );
      if (inclusions.length > 0) {
        await manager.save(PackageInclusion, inclusions);
      }

      const exclusions = (dto.exclusions ?? []).map((exc, index) =>
        manager.create(PackageExclusion, {
          package_id: savedPackage.id,
          text: exc.text,
          sort_order: exc.sort_order ?? index,
        }),
      );
      if (exclusions.length > 0) {
        await manager.save(PackageExclusion, exclusions);
      }

      return manager.findOne(Package, {
        where: { id: savedPackage.id },
        relations: { destination: true },
      }) as Promise<Package>;
    });
  }

  async create(dto: CreatePackageDto): Promise<Package> {
    return this.createPackage(dto);
  }

  /**
   * Full replace of pricing, itinerary (with activities/accommodations), inclusions, and exclusions.
   * Gallery images and featured_image are preserved; use upload endpoint to add images.
   */
  async updatePackage(id: number, dto: CreatePackageDto): Promise<Package> {
    return this.entityManager.transaction(async (manager) => {
      const pkg = await manager.findOne(Package, { where: { id } });
      if (!pkg) {
        throw new BadRequestException('Package not found');
      }

      const destination = await manager.findOne(Destination, {
        where: { id: dto.destination_id },
      });
      if (!destination) {
        throw new BadRequestException('Destination not found');
      }

      if (dto.min_pax > dto.max_pax) {
        throw new BadRequestException('min_pax cannot be greater than max_pax');
      }

      let slug = pkg.slug;
      if (dto.slug !== undefined && dto.slug !== null && String(dto.slug).trim() !== '') {
        slug = await this.resolveSlug(manager, String(dto.slug).trim(), id);
      }

      await manager.delete(PackagePricing, { package_id: id });
      await manager.delete(PackageItineraryDay, { package_id: id });
      await manager.delete(PackageInclusion, { package_id: id });
      await manager.delete(PackageExclusion, { package_id: id });

      pkg.destination_id = dto.destination_id;
      pkg.title = dto.title;
      pkg.slug = slug;
      pkg.description = dto.description;
      pkg.overview = dto.overview ?? null;
      pkg.duration_days = dto.duration_days;
      pkg.min_pax = dto.min_pax;
      pkg.max_pax = dto.max_pax;
      pkg.travel_year = dto.travel_year;
      pkg.base_price = dto.base_price;
      pkg.currency = dto.currency ?? 'USD';
      pkg.status = dto.status ?? pkg.status;

      await manager.save(Package, pkg);

      const pricingRows = (dto.pricing ?? []).map((row) =>
        manager.create(PackagePricing, {
          package_id: pkg.id,
          tier: row.tier,
          pax: row.is_single_supplement ? null : row.pax,
          price: row.price,
          is_single_supplement: row.is_single_supplement ?? false,
        }),
      );
      if (pricingRows.length > 0) {
        await manager.save(PackagePricing, pricingRows);
      }

      const dayEntities = (dto.itinerary ?? []).map((dayDto) =>
        manager.create(PackageItineraryDay, {
          package_id: pkg.id,
          day_number: dayDto.day_number,
          title: dayDto.title,
          description: dayDto.description,
          meals: dayDto.meals ?? null,
        }),
      );
      const savedDays =
        dayEntities.length > 0 ? await manager.save(PackageItineraryDay, dayEntities) : [];

      const activities: PackageActivity[] = [];
      for (let i = 0; i < savedDays.length; i++) {
        const dayDto = dto.itinerary[i];
        for (const activityDto of dayDto.activities) {
          activities.push(
            manager.create(PackageActivity, {
              itinerary_day_id: savedDays[i].id,
              name: activityDto.name,
            }),
          );
        }
      }
      if (activities.length > 0) {
        await manager.save(PackageActivity, activities);
      }

      const accommodations: PackageDayAccommodation[] = [];
      for (let i = 0; i < savedDays.length; i++) {
        const dayDto = dto.itinerary[i];
        for (const accommodationDto of dayDto.accommodations) {
          accommodations.push(
            manager.create(PackageDayAccommodation, {
              itinerary_day_id: savedDays[i].id,
              tier: accommodationDto.tier,
              name: accommodationDto.name,
            }),
          );
        }
      }
      if (accommodations.length > 0) {
        await manager.save(PackageDayAccommodation, accommodations);
      }

      const inclusions = (dto.inclusions ?? []).map((inc, index) =>
        manager.create(PackageInclusion, {
          package_id: pkg.id,
          text: inc.text,
          sort_order: inc.sort_order ?? index,
        }),
      );
      if (inclusions.length > 0) {
        await manager.save(PackageInclusion, inclusions);
      }

      const exclusions = (dto.exclusions ?? []).map((exc, index) =>
        manager.create(PackageExclusion, {
          package_id: pkg.id,
          text: exc.text,
          sort_order: exc.sort_order ?? index,
        }),
      );
      if (exclusions.length > 0) {
        await manager.save(PackageExclusion, exclusions);
      }

      return manager.findOne(Package, {
        where: { id: pkg.id },
        relations: { destination: true },
      }) as Promise<Package>;
    });
  }

  async getPackageById(id: number): Promise<any> {
    const pkg = await this.entityManager.findOne(Package, {
      where: { id },
      relations: { destination: true },
    });

    if (!pkg) {
      throw new BadRequestException('Package not found');
    }

    const [inclusions, exclusions, galleryImages, itineraryDays, pricing] = await Promise.all([
      this.entityManager.find(PackageInclusion, {
        where: { package_id: id },
        order: { sort_order: 'ASC' },
      }),
      this.entityManager.find(PackageExclusion, {
        where: { package_id: id },
        order: { sort_order: 'ASC' },
      }),
      this.entityManager.find(PackageGalleryImage, {
        where: { package_id: id },
        order: { sort_order: 'ASC' },
      }),
      this.entityManager.find(PackageItineraryDay, {
        where: { package_id: id },
        order: { day_number: 'ASC' },
      }),
      this.entityManager.find(PackagePricing, {
        where: { package_id: id },
        order: { tier: 'ASC', is_single_supplement: 'ASC', pax: 'ASC' },
      }),
    ]);

    const activitiesByDay = await this.loadActivitiesByDay(itineraryDays);
    const dayAccommodationsByDay = await this.loadDayAccommodationsByDay(itineraryDays);

    return this.buildPackagePayload(
      pkg,
      inclusions,
      exclusions,
      galleryImages,
      itineraryDays,
      activitiesByDay,
      dayAccommodationsByDay,
      pricing,
    );
  }

  async delete(id: number): Promise<void> {
    const pkg = await this.entityManager.findOne(Package, {
      where: { id },
    });

    if (!pkg) {
      throw new BadRequestException('Package not found');
    }

    const bookingCount = await this.entityManager.count(Booking, {
      where: { package_id: id },
    });

    if (bookingCount > 0) {
      throw new ConflictException('Cannot delete package with existing bookings');
    }

    await this.entityManager.remove(pkg);
  }

  async getSimilarPackages(packageId: number, limit = 5): Promise<any[]> {
    const basePackage = await this.entityManager.findOne(Package, {
      where: { id: packageId },
      relations: { destination: true },
    });

    if (!basePackage) {
      throw new BadRequestException('Package not found');
    }

    const destinationId = basePackage.destination_id;

    const candidatePackages = await this.entityManager.find(Package, {
      where: {
        destination_id: destinationId,
        status: PackageStatus.PUBLISHED,
      },
      relations: { destination: true },
      order: { id: 'DESC' },
      take: limit + 1, // Fetch one extra, then filter out the base package.
    });

    const similarPackages = candidatePackages
      .filter((pkg) => Number(pkg.id) !== Number(packageId))
      .slice(0, limit);

    if (similarPackages.length === 0) return [];

    const packageIds = similarPackages.map((pkg) => pkg.id);
    const [allInclusions, allExclusions, allGalleryImages, allItineraryDays, allPricing] =
      await Promise.all([
        this.entityManager.find(PackageInclusion, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', sort_order: 'ASC' },
        }),
        this.entityManager.find(PackageExclusion, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', sort_order: 'ASC' },
        }),
        this.entityManager.find(PackageGalleryImage, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', sort_order: 'ASC' },
        }),
        this.entityManager.find(PackageItineraryDay, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', day_number: 'ASC' },
        }),
        this.entityManager.find(PackagePricing, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', tier: 'ASC', is_single_supplement: 'ASC', pax: 'ASC' },
        }),
      ]);

    const activitiesByDay = await this.loadActivitiesByDay(allItineraryDays);
    const dayAccommodationsByDay = await this.loadDayAccommodationsByDay(allItineraryDays);

    const inclusionsByPackage = new Map<number, PackageInclusion[]>();
    const exclusionsByPackage = new Map<number, PackageExclusion[]>();
    const galleryByPackage = new Map<number, PackageGalleryImage[]>();
    const itineraryByPackage = new Map<number, PackageItineraryDay[]>();
    const pricingByPackage = new Map<number, PackagePricing[]>();

    for (const inclusion of allInclusions) {
      const existing = inclusionsByPackage.get(inclusion.package_id) ?? [];
      existing.push(inclusion);
      inclusionsByPackage.set(inclusion.package_id, existing);
    }

    for (const exclusion of allExclusions) {
      const existing = exclusionsByPackage.get(exclusion.package_id) ?? [];
      existing.push(exclusion);
      exclusionsByPackage.set(exclusion.package_id, existing);
    }

    for (const image of allGalleryImages) {
      const existing = galleryByPackage.get(image.package_id) ?? [];
      existing.push(image);
      galleryByPackage.set(image.package_id, existing);
    }

    for (const day of allItineraryDays) {
      const existing = itineraryByPackage.get(day.package_id) ?? [];
      existing.push(day);
      itineraryByPackage.set(day.package_id, existing);
    }

    for (const row of allPricing) {
      const existing = pricingByPackage.get(row.package_id) ?? [];
      existing.push(row);
      pricingByPackage.set(row.package_id, existing);
    }

    return similarPackages.map((pkg) =>
      this.buildPackagePayload(
        pkg,
        inclusionsByPackage.get(pkg.id) ?? [],
        exclusionsByPackage.get(pkg.id) ?? [],
        galleryByPackage.get(pkg.id) ?? [],
        itineraryByPackage.get(pkg.id) ?? [],
        activitiesByDay,
        dayAccommodationsByDay,
        pricingByPackage.get(pkg.id) ?? [],
      ),
    );
  }

  async getPackageStatistics(): Promise<PackageStatistics> {
    const [total, draft, published, archived] = await Promise.all([
      this.entityManager.count(Package),
      this.entityManager.count(Package, { where: { status: PackageStatus.DRAFT } }),
      this.entityManager.count(Package, { where: { status: PackageStatus.PUBLISHED } }),
      this.entityManager.count(Package, { where: { status: PackageStatus.ARCHIVED } }),
    ]);
    return { total, draft, published, archived };
  }

  async countPackagesByDestinationSlug(slug: string): Promise<{ count: number }> {
    const trimmed = String(slug ?? '').trim();
    if (trimmed === '') {
      throw new BadRequestException('destinationslug is required');
    }
    const count = await this.entityManager
      .createQueryBuilder(Package, 'pkg')
      .innerJoin('pkg.destination', 'd')
      .where('d.slug = :slug', { slug: trimmed })
      .getCount();
    return { count };
  }

  async getAllPackages(
    pagination: PaginationData,
    status?: PackageStatus,
    destination?: string,
  ): Promise<PaginationResponse> {
    const where: FindOptionsWhere<Package> = {};

    if (status !== undefined && status !== null && String(status).trim() !== '') {
      const statusFilter = String(status).toUpperCase() as PackageStatus;
      if (!Object.values(PackageStatus).includes(statusFilter)) {
        throw new BadRequestException('Invalid package status');
      }
      where.status = statusFilter;
    }

    if (destination !== undefined && destination !== null && String(destination).trim() !== '') {
      const slug = String(destination).trim();
      const dest = await this.entityManager.findOne(Destination, { where: { slug } });
      if (!dest) {
        return this.paginate([], 0, pagination);
      }
      where.destination_id = dest.id;
    }

    const count = await this.entityManager.count(Package, { where });
    const packages = await this.entityManager.find(Package, {
      where,
      relations: { destination: true },
      order: { id: 'DESC' },
      skip: pagination.skip,
      take: pagination.take,
    });

    if (packages.length === 0) {
      return this.paginate([], count, pagination);
    }

    const packageIds = packages.map((pkg) => pkg.id);

    const [allInclusions, allExclusions, allGalleryImages, allItineraryDays, allPricing] =
      await Promise.all([
        this.entityManager.find(PackageInclusion, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', sort_order: 'ASC' },
        }),
        this.entityManager.find(PackageExclusion, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', sort_order: 'ASC' },
        }),
        this.entityManager.find(PackageGalleryImage, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', sort_order: 'ASC' },
        }),
        this.entityManager.find(PackageItineraryDay, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', day_number: 'ASC' },
        }),
        this.entityManager.find(PackagePricing, {
          where: { package_id: In(packageIds) },
          order: { package_id: 'ASC', tier: 'ASC', is_single_supplement: 'ASC', pax: 'ASC' },
        }),
      ]);

    const activitiesByDay = await this.loadActivitiesByDay(allItineraryDays);
    const dayAccommodationsByDay = await this.loadDayAccommodationsByDay(allItineraryDays);

    const inclusionsByPackage = new Map<number, PackageInclusion[]>();
    const exclusionsByPackage = new Map<number, PackageExclusion[]>();
    const galleryByPackage = new Map<number, PackageGalleryImage[]>();
    const itineraryByPackage = new Map<number, PackageItineraryDay[]>();
    const pricingByPackage = new Map<number, PackagePricing[]>();

    for (const inclusion of allInclusions) {
      const existing = inclusionsByPackage.get(inclusion.package_id) ?? [];
      existing.push(inclusion);
      inclusionsByPackage.set(inclusion.package_id, existing);
    }

    for (const exclusion of allExclusions) {
      const existing = exclusionsByPackage.get(exclusion.package_id) ?? [];
      existing.push(exclusion);
      exclusionsByPackage.set(exclusion.package_id, existing);
    }

    for (const image of allGalleryImages) {
      const existing = galleryByPackage.get(image.package_id) ?? [];
      existing.push(image);
      galleryByPackage.set(image.package_id, existing);
    }

    for (const day of allItineraryDays) {
      const existing = itineraryByPackage.get(day.package_id) ?? [];
      existing.push(day);
      itineraryByPackage.set(day.package_id, existing);
    }

    for (const row of allPricing) {
      const existing = pricingByPackage.get(row.package_id) ?? [];
      existing.push(row);
      pricingByPackage.set(row.package_id, existing);
    }

    const formattedPackages = packages.map((pkg) =>
      this.buildPackagePayload(
        pkg,
        inclusionsByPackage.get(pkg.id) ?? [],
        exclusionsByPackage.get(pkg.id) ?? [],
        galleryByPackage.get(pkg.id) ?? [],
        itineraryByPackage.get(pkg.id) ?? [],
        activitiesByDay,
        dayAccommodationsByDay,
        pricingByPackage.get(pkg.id) ?? [],
      ),
    );

    return this.paginate(formattedPackages, count, pagination);
  }

  async addPackageImages(
    packageId: number,
    files: Express.Multer.File[],
  ): Promise<{ featured_image: string | null; uploaded: { url: string; sort_order: number }[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No images uploaded');
    }

    for (const file of files) {
      if (!file.mimetype?.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }
      if (!file.buffer || file.buffer.length === 0) {
        throw new BadRequestException('Empty file uploaded');
      }
    }

    this.ensureCloudinaryConfigured();

    return this.entityManager.transaction(async (manager) => {
      const pkg = await manager.findOne(Package, { where: { id: packageId } });
      if (!pkg) {
        throw new BadRequestException('Package not found');
      }

      const currentImages = await manager.find(PackageGalleryImage, {
        where: { package_id: packageId },
        order: { sort_order: 'DESC' },
        take: 1,
      });
      const baseSortOrder = currentImages.length > 0 ? currentImages[0].sort_order + 1 : 0;

      const folder = `packages/${packageId}/gallery`;

      const uploadOne = (file: Express.Multer.File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
            },
            (error, result) => {
              if (error) return reject(error);
              const url = result?.secure_url || result?.url;
              if (!url) return reject(new Error('Cloudinary did not return a URL'));
              resolve(url);
            },
          );
          stream.end(file.buffer);
        });
      };

      const uploadedUrls = await Promise.all(files.map((f) => uploadOne(f)));

      const created: { url: string; sort_order: number }[] = [];
      for (let i = 0; i < uploadedUrls.length; i++) {
        const sort_order = baseSortOrder + i;
        const img = manager.create(PackageGalleryImage, {
          package_id: packageId,
          url: uploadedUrls[i],
          alt: files[i].originalname || null,
          sort_order,
        });
        await manager.save(PackageGalleryImage, img);
        created.push({ url: uploadedUrls[i], sort_order });
      }

      if (!pkg.featured_image && uploadedUrls.length > 0) {
        pkg.featured_image = uploadedUrls[0];
        await manager.save(Package, pkg);
      }

      return {
        featured_image: pkg.featured_image ?? null,
        uploaded: created,
      };
    });
  }

  private slugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  private async resolveSlug(
    entityManager: EntityManager,
    baseSlug: string,
    excludePackageId?: number,
  ): Promise<string> {
    if (!baseSlug) return 'package';
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const found = await entityManager.findOne(Package, { where: { slug } });
      if (!found) {
        return slug;
      }
      if (
        excludePackageId !== undefined &&
        excludePackageId !== null &&
        Number(found.id) === Number(excludePackageId)
      ) {
        return slug;
      }
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  private ensureCloudinaryConfigured(): void {
    if (this.cloudinaryConfigured) return;

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary is not configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.cloudinaryConfigured = true;
  }

  private formatDate(unixSeconds?: number): string | null {
    if (!unixSeconds) return null;
    return DateTime.fromSeconds(unixSeconds).toFormat('yyyy-LL-dd');
  }

  private async loadActivitiesByDay(
    itineraryDays: PackageItineraryDay[],
  ): Promise<Map<number, PackageActivity[]>> {
    const dayIds = itineraryDays.map((day) => day.id);
    const activitiesByDay = new Map<number, PackageActivity[]>();
    if (dayIds.length === 0) {
      return activitiesByDay;
    }

    const activities = await this.entityManager.find(PackageActivity, {
      where: { itinerary_day_id: In(dayIds) },
      order: { itinerary_day_id: 'ASC', name: 'ASC' },
    });

    for (const activity of activities) {
      const existing = activitiesByDay.get(activity.itinerary_day_id) ?? [];
      existing.push(activity);
      activitiesByDay.set(activity.itinerary_day_id, existing);
    }

    return activitiesByDay;
  }

  private async loadDayAccommodationsByDay(
    itineraryDays: PackageItineraryDay[],
  ): Promise<Map<number, PackageDayAccommodation[]>> {
    const dayIds = itineraryDays.map((day) => day.id);
    const accommodationsByDay = new Map<number, PackageDayAccommodation[]>();
    if (dayIds.length === 0) {
      return accommodationsByDay;
    }

    const accommodations = await this.entityManager.find(PackageDayAccommodation, {
      where: { itinerary_day_id: In(dayIds) },
      order: { itinerary_day_id: 'ASC', tier: 'ASC', name: 'ASC' },
    });

    for (const accommodation of accommodations) {
      const existing = accommodationsByDay.get(accommodation.itinerary_day_id) ?? [];
      existing.push(accommodation);
      accommodationsByDay.set(accommodation.itinerary_day_id, existing);
    }

    return accommodationsByDay;
  }

  private buildPackagePayload(
    pkg: Package,
    inclusions: PackageInclusion[],
    exclusions: PackageExclusion[],
    galleryImages: PackageGalleryImage[],
    itineraryDays: PackageItineraryDay[],
    activitiesByDay: Map<number, PackageActivity[]>,
    dayAccommodationsByDay: Map<number, PackageDayAccommodation[]>,
    pricing: PackagePricing[],
  ): any {
    const destination = pkg.destination
      ? {
          id: Number(pkg.destination.id),
          name: pkg.destination.name,
          slug: pkg.destination.slug,
          description: pkg.destination.description,
          hero_image: pkg.destination.hero_image ?? null,
          is_active: pkg.destination.is_active,
          sort_order: pkg.destination.sort_order,
          created_at: this.formatDate(pkg.destination.created_at),
          updated_at: this.formatDate(pkg.destination.updated_at),
        }
      : null;

    return {
      id: Number(pkg.id),
      destination,
      title: pkg.title,
      slug: pkg.slug,
      description: pkg.description,
      overview: pkg.overview ?? null,
      featured_image: pkg.featured_image ?? null,
      duration_days: pkg.duration_days,
      min_pax: pkg.min_pax,
      max_pax: pkg.max_pax,
      travel_year: pkg.travel_year,
      base_price: pkg.base_price,
      currency: pkg.currency,
      status: pkg.status,
      created_at: this.formatDate(pkg.created_at),
      updated_at: this.formatDate(pkg.updated_at),
      inclusions: inclusions.map((inc) => ({
        id: Number(inc.id),
        text: inc.text,
        sort_order: inc.sort_order,
        created_at: this.formatDate(inc.created_at),
        updated_at: this.formatDate(inc.updated_at),
      })),
      exclusions: exclusions.map((exc) => ({
        id: Number(exc.id),
        text: exc.text,
        sort_order: exc.sort_order,
        created_at: this.formatDate(exc.created_at),
        updated_at: this.formatDate(exc.updated_at),
      })),
      gallery_images: galleryImages.map((img) => ({
        id: Number(img.id),
        url: img.url,
        alt: img.alt ?? null,
        sort_order: img.sort_order,
        created_at: this.formatDate(img.created_at),
        updated_at: this.formatDate(img.updated_at),
      })),
      pricing: pricing.map((row) => ({
        id: Number(row.id),
        tier: row.tier,
        pax: row.pax ?? null,
        price: row.price,
        is_single_supplement: row.is_single_supplement,
        created_at: this.formatDate(row.created_at),
        updated_at: this.formatDate(row.updated_at),
      })),
      itinerary_days: itineraryDays.map((day) => {
        const activities = activitiesByDay.get(day.id) ?? [];
        const accommodations = dayAccommodationsByDay.get(day.id) ?? [];
        return {
          id: Number(day.id),
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          meals: day.meals ?? [],
          activities: activities.map((activity) => ({
            id: Number(activity.id),
            name: activity.name,
            created_at: this.formatDate(activity.created_at),
            updated_at: this.formatDate(activity.updated_at),
          })),
          accommodations: accommodations.map((accommodation) => ({
            id: Number(accommodation.id),
            tier: accommodation.tier,
            name: accommodation.name,
            created_at: this.formatDate(accommodation.created_at),
            updated_at: this.formatDate(accommodation.updated_at),
          })),
          created_at: this.formatDate(day.created_at),
          updated_at: this.formatDate(day.updated_at),
        };
      }),
    };
  }
}
