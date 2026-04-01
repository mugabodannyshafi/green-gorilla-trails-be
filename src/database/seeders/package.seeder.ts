import { EntityManager } from 'typeorm';
import { EntitySeeder } from './seeder';
import { Destination } from '../entities/3_destination.entity';
import { Package, PackageStatus } from '../entities/2_package.entity';
import { PackageAccommodationTier } from '../entities/17_package_accommodation_option.entity';
import { PackagePricing } from '../entities/16_package_pricing.entity';
import { PackageItineraryDay } from '../entities/5_package_itinerary_day.entity';
import { MealType, PackageActivity } from '../entities/18_package_activity.entity';
import { PackageInclusion } from '../entities/7_package_inclusion.entity';
import { PackageExclusion } from '../entities/8_package_exclusion.entity';
import { PackageGalleryImage } from '../entities/4_package_gallery_image.entity';
import { PackageDayAccommodation } from '../entities/6_package_day_accommodation.entity';

type SeedPricingRow = {
  tier: PackageAccommodationTier;
  pax?: number;
  price: string;
  is_single_supplement?: boolean;
};

type SeedItineraryDay = {
  day_number: number;
  title: string;
  description: string;
  meals: MealType[];
  activities: string[];
  accommodations: Array<{ tier: PackageAccommodationTier; name: string }>;
};

type SeedPackage = {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  overview: string;
  duration_days: number;
  min_pax: number;
  max_pax: number;
  travel_year: number;
  difficulty_level: string;
  base_price: string;
  currency: string;
  featured_image: string;
  status: PackageStatus;
  pricing: SeedPricingRow[];
  itinerary: SeedItineraryDay[];
  galleryImages: Array<{ url: string; alt?: string }>;
  inclusions: string[];
  exclusions: string[];
};

const PACKAGES: SeedPackage[] = [
  {
    title: '1 Day Akagera National Park Game Drive',
    slug: '1-day-akagera-national-park-game-drive',
    short_description: 'Classic one-day Akagera safari with a full game drive.',
    description:
      'Depart Kigali early for Akagera National Park and enjoy a full-day game drive with an expert guide before returning to Kigali in the evening.',
    overview:
      'Ideal for travelers with limited time, this one-day safari offers excellent chances to spot big game in Akagera.',
    duration_days: 1,
    min_pax: 2,
    max_pax: 6,
    travel_year: 2026,
    difficulty_level: 'Easy',
    base_price: '480.00',
    currency: 'USD',
    featured_image:
      'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80',
    status: PackageStatus.PUBLISHED,
    pricing: [
      ...buildTierPricing(PackageAccommodationTier.STANDARD, [
        '480.00',
        '395.00',
        '350.00',
        '320.00',
        '299.00',
      ]),
      ...buildTierPricing(PackageAccommodationTier.MIDRANGE, [
        '620.00',
        '510.00',
        '460.00',
        '420.00',
        '399.00',
      ]),
      ...buildTierPricing(PackageAccommodationTier.LUXURY, [
        '890.00',
        '760.00',
        '690.00',
        '635.00',
        '599.00',
      ]),
      { tier: PackageAccommodationTier.STANDARD, is_single_supplement: true, price: '60.00' },
      { tier: PackageAccommodationTier.MIDRANGE, is_single_supplement: true, price: '95.00' },
      { tier: PackageAccommodationTier.LUXURY, is_single_supplement: true, price: '190.00' },
    ],
    itinerary: [
      {
        day_number: 1,
        title: 'Kigali - Akagera - Kigali',
        description:
          'Early pickup from Kigali, transfer to Akagera National Park, full-day game drive, picnic lunch, and return to Kigali.',
        meals: [MealType.LUNCH],
        activities: [
          'Scenic transfer to Akagera National Park',
          'Morning game drive',
          'Picnic lunch inside the park',
          'Afternoon game viewing and return to Kigali',
        ],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Ruzizi Tented Lodge' },
          { tier: PackageAccommodationTier.LUXURY, name: 'Magashi Camp' },
        ],
      },
    ],
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1400&q=80',
        alt: 'Akagera wildlife landscape',
      },
      {
        url: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80',
        alt: 'Safari jeep in Akagera',
      },
    ],
    inclusions: [
      'Private safari vehicle and English-speaking guide',
      'Akagera National Park entry fees',
      'Packed lunch and bottled water',
      'Roundtrip transfers from Kigali',
    ],
    exclusions: [
      'International and domestic flights',
      'Tips and gratuities',
      'Personal travel insurance',
      'Any optional activities not listed',
    ],
  },
  {
    title: '1 Day Gorilla Trekking Experience',
    slug: '1-day-gorilla-trekking-experience',
    short_description: 'A focused one-day gorilla trekking journey from Kigali.',
    description:
      'Transfer from Kigali to Volcanoes National Park for a guided gorilla trek and return to Kigali the same day.',
    overview:
      'A premium short-format experience crafted for travelers who want to encounter mountain gorillas in a single day.',
    duration_days: 1,
    min_pax: 2,
    max_pax: 6,
    travel_year: 2026,
    difficulty_level: 'Moderate',
    base_price: '1353.00',
    currency: 'USD',
    featured_image:
      'https://images.unsplash.com/photo-1590041177983-df0f3f91f5f5?auto=format&fit=crop&w=1400&q=80',
    status: PackageStatus.PUBLISHED,
    pricing: [
      ...buildTierPricing(PackageAccommodationTier.STANDARD, [
        '1353.00',
        '777.00',
        '699.00',
        '660.00',
        '620.00',
      ]),
      ...buildTierPricing(PackageAccommodationTier.MIDRANGE, [
        '1625.00',
        '930.00',
        '840.00',
        '790.00',
        '745.00',
      ]),
      ...buildTierPricing(PackageAccommodationTier.LUXURY, [
        '2490.00',
        '1470.00',
        '1325.00',
        '1240.00',
        '1160.00',
      ]),
      { tier: PackageAccommodationTier.STANDARD, is_single_supplement: true, price: '60.00' },
      { tier: PackageAccommodationTier.MIDRANGE, is_single_supplement: true, price: '120.00' },
      { tier: PackageAccommodationTier.LUXURY, is_single_supplement: true, price: '320.00' },
    ],
    itinerary: [
      {
        day_number: 1,
        title: 'Kigali - Gorilla Trek - Kigali',
        description:
          'Early departure to Volcanoes National Park, ranger briefing, gorilla trekking experience, lunch, and return to Kigali.',
        meals: [MealType.BREAKFAST, MealType.LUNCH],
        activities: [
          'Early transfer to Volcanoes National Park',
          'Park briefing at Kinigi headquarters',
          'Guided mountain gorilla trek',
          'Transfer back to Kigali',
        ],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Le Bambou Gorilla Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Five Volcanoes Boutique Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'Bisate Lodge' },
        ],
      },
    ],
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80',
        alt: 'Volcanoes National Park road',
      },
      {
        url: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80',
        alt: 'Forest gorilla habitat',
      },
    ],
    inclusions: [
      'Gorilla trekking permit',
      'Private transport and professional driver-guide',
      'Packed breakfast and lunch',
      'Park ranger services',
    ],
    exclusions: ['Visa fees', 'Personal porter fees', 'Tips and gratuities', 'Alcoholic beverages'],
  },
  {
    title: '9 Days Rwanda Luxury Flying Safari',
    slug: '9-days-rwanda-luxury-flying-safari',
    short_description:
      'Exclusive fly-in Rwanda circuit with gorillas, primates, and savannah safari.',
    description:
      'A nine-day luxury journey connecting Kigali, Volcanoes, Nyungwe, and Akagera with scenic flights, top lodges, and curated wildlife experiences.',
    overview:
      'Designed for high-end safari travelers seeking maximum comfort, reduced driving time, and premium guiding across Rwanda.',
    duration_days: 9,
    min_pax: 2,
    max_pax: 6,
    travel_year: 2026,
    difficulty_level: 'Moderate',
    base_price: '6890.00',
    currency: 'USD',
    featured_image:
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80',
    status: PackageStatus.PUBLISHED,
    pricing: [
      ...buildTierPricing(PackageAccommodationTier.STANDARD, [
        '6890.00',
        '5250.00',
        '4780.00',
        '4490.00',
        '4290.00',
      ]),
      ...buildTierPricing(PackageAccommodationTier.MIDRANGE, [
        '8450.00',
        '6420.00',
        '5850.00',
        '5480.00',
        '5190.00',
      ]),
      ...buildTierPricing(PackageAccommodationTier.LUXURY, [
        '11600.00',
        '8790.00',
        '8040.00',
        '7550.00',
        '7190.00',
      ]),
      { tier: PackageAccommodationTier.STANDARD, is_single_supplement: true, price: '420.00' },
      { tier: PackageAccommodationTier.MIDRANGE, is_single_supplement: true, price: '790.00' },
      { tier: PackageAccommodationTier.LUXURY, is_single_supplement: true, price: '1860.00' },
    ],
    itinerary: [
      {
        day_number: 1,
        title: 'Arrival in Kigali',
        description:
          'Meet and greet at Kigali International Airport, transfer to hotel, and safari briefing.',
        meals: [MealType.DINNER],
        activities: [
          'Airport meet and greet',
          'Private transfer to hotel',
          'Evening safari briefing',
        ],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 2,
        title: 'Kigali City & Flight to Volcanoes',
        description:
          'Morning Kigali highlights tour, lunch, and afternoon scenic flight/transfer to Volcanoes region lodge.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: [
          'Kigali Genocide Memorial visit',
          'Artisan market stop',
          'Scenic transfer/flight to Volcanoes',
        ],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 3,
        title: 'Gorilla Trekking',
        description: 'Early park briefing followed by gorilla trek and leisure at the lodge.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: ['Park briefing', 'Gorilla trekking experience', 'Lodge sundowner'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 4,
        title: 'Golden Monkey Trek & Community Experience',
        description:
          'Track golden monkeys in the morning and visit local conservation initiatives.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: ['Golden monkey trekking', 'Community cultural visit', 'Optional nature walk'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 5,
        title: 'Transfer to Nyungwe',
        description: 'Scenic transfer to Nyungwe with tea estate stopovers.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: ['Scenic transfer to Nyungwe', 'Tea plantation visit', 'Lodge check-in'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 6,
        title: 'Chimpanzee Trek & Canopy Walk',
        description: 'Primate trekking in Nyungwe followed by the famous canopy walk.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: ['Chimpanzee trekking', 'Nyungwe canopy walk', 'Forest interpretation walk'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 7,
        title: 'Flight/Transfer to Akagera',
        description: 'Move to Akagera for savannah safari segment.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: ['Scenic transfer/flight to Akagera', 'Sunset game drive'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 8,
        title: 'Akagera Game Drives & Boat Safari',
        description: 'Full-day wildlife exploration by vehicle and boat.',
        meals: [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER],
        activities: ['Morning game drive', 'Lake Ihema boat safari', 'Afternoon game drive'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
      {
        day_number: 9,
        title: 'Return to Kigali & Departure',
        description: 'Final transfer to Kigali for outbound international departure.',
        meals: [MealType.BREAKFAST, MealType.LUNCH],
        activities: ['Road transfer to Kigali', 'Airport drop-off'],
        accommodations: [
          { tier: PackageAccommodationTier.STANDARD, name: 'Mantis Akagera Game Lodge' },
          { tier: PackageAccommodationTier.MIDRANGE, name: 'Nyungwe Top View Hill Hotel' },
          { tier: PackageAccommodationTier.LUXURY, name: 'One&Only Gorilla’s Nest' },
        ],
      },
    ],
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80',
        alt: 'Luxury Rwanda safari lodge',
      },
      {
        url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80',
        alt: 'Akagera savannah sunset',
      },
      {
        url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1400&q=80',
        alt: 'Aerial safari transfer views',
      },
    ],
    inclusions: [
      'Luxury accommodation on full board basis',
      'One gorilla permit and one chimpanzee permit per guest',
      'Private 4x4 safari vehicle and specialist guides',
      'Domestic flights/scenic air transfers as specified',
      'Park fees and conservation levies',
    ],
    exclusions: [
      'International flights',
      'Visa and travel insurance',
      'Premium beverages and private bar bills',
      'Personal expenses and laundry',
      'Tips and gratuities',
    ],
  },
];

export class PackageSeeder implements EntitySeeder {
  async run(db: EntityManager): Promise<void> {
    const destination = await db.findOne(Destination, { where: { slug: 'rwanda' } });
    if (!destination) {
      console.log('Package seeding skipped: destination "rwanda" not found');
      return;
    }

    await db.transaction(async (tx) => {
      for (const row of PACKAGES) {
        await this.seedPackage(tx, destination.id, row);
      }
    });

    console.log('Packages seeded successfully');
  }

  private async seedPackage(
    tx: EntityManager,
    destinationId: number,
    row: SeedPackage,
  ): Promise<void> {
    let pkg = await tx.findOne(Package, { where: { slug: row.slug } });
    if (!pkg) {
      pkg = tx.create(Package, {
        destination_id: destinationId,
        title: row.title,
        slug: row.slug,
      });
    }

    pkg.destination_id = destinationId;
    pkg.title = row.title;
    pkg.slug = row.slug;
    pkg.short_description = row.short_description;
    pkg.description = row.description;
    pkg.overview = row.overview;
    pkg.featured_image = row.featured_image;
    pkg.duration_days = row.duration_days;
    pkg.min_pax = row.min_pax;
    pkg.max_pax = row.max_pax;
    pkg.travel_year = row.travel_year;
    pkg.difficulty_level = row.difficulty_level;
    pkg.base_price = row.base_price;
    pkg.currency = row.currency;
    pkg.status = row.status;

    const savedPackage = await tx.save(Package, pkg);
    const packageId = savedPackage.id;

    await tx.delete(PackagePricing, { package_id: packageId });
    await tx.delete(PackageInclusion, { package_id: packageId });
    await tx.delete(PackageExclusion, { package_id: packageId });
    await tx.delete(PackageGalleryImage, { package_id: packageId });
    await tx.delete(PackageItineraryDay, { package_id: packageId });

    const pricing = row.pricing.map((priceRow) =>
      tx.create(PackagePricing, {
        package_id: packageId,
        tier: priceRow.tier,
        pax: priceRow.is_single_supplement ? null : priceRow.pax,
        price: priceRow.price,
        is_single_supplement: priceRow.is_single_supplement ?? false,
      }),
    );
    await tx.save(PackagePricing, pricing);

    const galleryImages = row.galleryImages.map((image, index) =>
      tx.create(PackageGalleryImage, {
        package_id: packageId,
        url: image.url,
        alt: image.alt ?? null,
        sort_order: index,
      }),
    );
    await tx.save(PackageGalleryImage, galleryImages);

    const itineraryDays = row.itinerary.map((day) =>
      tx.create(PackageItineraryDay, {
        package_id: packageId,
        day_number: day.day_number,
        title: day.title,
        description: day.description,
        meals: day.meals,
      }),
    );
    const savedDays = await tx.save(PackageItineraryDay, itineraryDays);

    const dayAccommodations: PackageDayAccommodation[] = [];
    for (let i = 0; i < savedDays.length; i++) {
      for (const option of row.itinerary[i].accommodations) {
        dayAccommodations.push(
          tx.create(PackageDayAccommodation, {
            itinerary_day_id: savedDays[i].id,
            tier: option.tier,
            name: option.name,
          }),
        );
      }
    }
    await tx.save(PackageDayAccommodation, dayAccommodations);

    const activities: PackageActivity[] = [];
    for (let i = 0; i < savedDays.length; i++) {
      for (const activityName of row.itinerary[i].activities) {
        activities.push(
          tx.create(PackageActivity, {
            itinerary_day_id: savedDays[i].id,
            name: activityName,
          }),
        );
      }
    }
    await tx.save(PackageActivity, activities);

    const inclusions = row.inclusions.map((text, index) =>
      tx.create(PackageInclusion, {
        package_id: packageId,
        text,
        sort_order: index,
      }),
    );
    await tx.save(PackageInclusion, inclusions);

    const exclusions = row.exclusions.map((text, index) =>
      tx.create(PackageExclusion, {
        package_id: packageId,
        text,
        sort_order: index,
      }),
    );
    await tx.save(PackageExclusion, exclusions);
  }
}

function buildTierPricing(tier: PackageAccommodationTier, paxPrices: string[]): SeedPricingRow[] {
  return [2, 3, 4, 5, 6].map((pax, index) => ({
    tier,
    pax,
    price: paxPrices[index],
  }));
}
