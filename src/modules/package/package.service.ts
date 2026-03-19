import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, FindOptionsWhere, In } from 'typeorm';
import { DateTime } from 'luxon';
import { Package, PackageStatus } from '../../database/entities/2_package.entity';
import { Destination } from '../../database/entities/3_destination.entity';
import { PackageInclusion } from '../../database/entities/7_package_inclusion.entity';
import { PackageExclusion } from '../../database/entities/8_package_exclusion.entity';
import { PackageGalleryImage } from '../../database/entities/4_package_gallery_image.entity';
import { PackageItineraryDay } from '../../database/entities/5_package_itinerary_day.entity';
import { PackageDayAccommodation } from '../../database/entities/6_package_day_accommodation.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { v2 as cloudinary } from 'cloudinary';
import { BaseService, PaginationData, PaginationResponse } from '@rwanda360/rwanda360-service-sdk';

@Injectable()
export class PackageService extends BaseService {
  private cloudinaryConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
  ) {
    super();
  }

  async create(dto: CreatePackageDto): Promise<Package> {
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
        short_description: dto.short_description ?? null,
        description: dto.description,
        featured_image: null,
        duration_days: dto.duration_days,
        difficulty_level: dto.difficulty_level ?? null,
        base_price: dto.base_price,
        currency: dto.currency ?? 'USD',
        status: dto.status ?? PackageStatus.DRAFT,
      });
      const savedPackage = await manager.save(Package, pkg);

      const inclusions = dto.inclusions ?? [];
      for (let i = 0; i < inclusions.length; i++) {
        const inc = manager.create(PackageInclusion, {
          package_id: savedPackage.id,
          text: inclusions[i].text,
          sort_order: inclusions[i].sort_order ?? i,
        });
        await manager.save(PackageInclusion, inc);
      }

      const exclusions = dto.exclusions ?? [];
      for (let i = 0; i < exclusions.length; i++) {
        const exc = manager.create(PackageExclusion, {
          package_id: savedPackage.id,
          text: exclusions[i].text,
          sort_order: exclusions[i].sort_order ?? i,
        });
        await manager.save(PackageExclusion, exc);
      }

      const itineraryDays = dto.itinerary_days ?? [];
      for (const dayDto of itineraryDays) {
        const day = manager.create(PackageItineraryDay, {
          package_id: savedPackage.id,
          day_number: dayDto.day_number,
          title: dayDto.title,
          description: dayDto.description,
          meals_text: dayDto.meals_text ?? null,
        });
        const savedDay = await manager.save(PackageItineraryDay, day);

        const accommodations = dayDto.accommodations ?? [];
        for (const accDto of accommodations) {
          const acc = manager.create(PackageDayAccommodation, {
            itinerary_day_id: savedDay.id,
            tier: accDto.tier,
            name: accDto.name,
          });
          await manager.save(PackageDayAccommodation, acc);
        }
      }

      return manager.findOne(Package, {
        where: { id: savedPackage.id },
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

    const [inclusions, exclusions, galleryImages, itineraryDays] = await Promise.all([
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
    ]);

    // Load accommodations for each itinerary day and attach them to the day objects.
    const dayIds = itineraryDays.map((d) => d.id);
    const accommodationsByDay = new Map<number, PackageDayAccommodation[]>();

    if (dayIds.length > 0) {
      const accommodations = await this.entityManager.find(PackageDayAccommodation, {
        where: { itinerary_day_id: In(dayIds) },
        order: { tier: 'ASC', name: 'ASC' },
      });

      for (const acc of accommodations) {
        const existing = accommodationsByDay.get(acc.itinerary_day_id) ?? [];
        existing.push(acc);
        accommodationsByDay.set(acc.itinerary_day_id, existing);
      }
    }

    return this.buildPackagePayload(
      pkg,
      inclusions,
      exclusions,
      galleryImages,
      itineraryDays,
      accommodationsByDay,
    );
  }

  async getAllPackages(
    pagination: PaginationData,
    status?: PackageStatus,
    destination?: number | string,
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
      const destinationId = Number.parseInt(String(destination), 10);
      if (!Number.isInteger(destinationId) || destinationId <= 0) {
        throw new BadRequestException('Invalid destination id');
      }
      where.destination_id = destinationId;
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

    const [allInclusions, allExclusions, allGalleryImages, allItineraryDays] = await Promise.all([
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
    ]);

    const itineraryDayIds = allItineraryDays.map((day) => day.id);
    const allAccommodations =
      itineraryDayIds.length > 0
        ? await this.entityManager.find(PackageDayAccommodation, {
            where: { itinerary_day_id: In(itineraryDayIds) },
            order: { itinerary_day_id: 'ASC', tier: 'ASC', name: 'ASC' },
          })
        : [];

    const inclusionsByPackage = new Map<number, PackageInclusion[]>();
    const exclusionsByPackage = new Map<number, PackageExclusion[]>();
    const galleryByPackage = new Map<number, PackageGalleryImage[]>();
    const itineraryByPackage = new Map<number, PackageItineraryDay[]>();
    const accommodationsByDay = new Map<number, PackageDayAccommodation[]>();

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

    for (const acc of allAccommodations) {
      const existing = accommodationsByDay.get(acc.itinerary_day_id) ?? [];
      existing.push(acc);
      accommodationsByDay.set(acc.itinerary_day_id, existing);
    }

    const formattedPackages = packages.map((pkg) =>
      this.buildPackagePayload(
        pkg,
        inclusionsByPackage.get(pkg.id) ?? [],
        exclusionsByPackage.get(pkg.id) ?? [],
        galleryByPackage.get(pkg.id) ?? [],
        itineraryByPackage.get(pkg.id) ?? [],
        accommodationsByDay,
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

  private async resolveSlug(entityManager: EntityManager, baseSlug: string): Promise<string> {
    if (!baseSlug) return 'package';
    let slug = baseSlug;
    let suffix = 0;
    while (await entityManager.findOne(Package, { where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    return slug;
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

  private buildPackagePayload(
    pkg: Package,
    inclusions: PackageInclusion[],
    exclusions: PackageExclusion[],
    galleryImages: PackageGalleryImage[],
    itineraryDays: PackageItineraryDay[],
    accommodationsByDay: Map<number, PackageDayAccommodation[]>,
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
      short_description: pkg.short_description ?? null,
      description: pkg.description,
      featured_image: pkg.featured_image ?? null,
      duration_days: pkg.duration_days,
      difficulty_level: pkg.difficulty_level ?? null,
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
      itinerary_days: itineraryDays.map((day) => {
        const accommodations = accommodationsByDay.get(day.id) ?? [];
        return {
          id: Number(day.id),
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          meals_text: day.meals_text ?? null,
          accommodations: accommodations.map((acc) => ({
            id: Number(acc.id),
            tier: acc.tier,
            name: acc.name,
            created_at: this.formatDate(acc.created_at),
            updated_at: this.formatDate(acc.updated_at),
          })),
          created_at: this.formatDate(day.created_at),
          updated_at: this.formatDate(day.updated_at),
        };
      }),
    };
  }
}
