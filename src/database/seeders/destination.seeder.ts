import { EntityManager } from 'typeorm';
import { EntitySeeder } from './seeder';
import { Destination } from '../entities/3_destination.entity';

const SEED_DESTINATIONS: Array<{
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  hero_image?: string;
}> = [
  {
    name: 'Rwanda',
    slug: 'rwanda',
    description:
      'Home to mountain gorillas in Volcanoes National Park and diverse wildlife. Experience gorilla trekking and cultural encounters.',
    sort_order: 1,
    hero_image:
      'https://cdn.sanity.io/images/y0jkjygh/production/f0fa11ef9a5a848d744e534b0972d13fefc18967-2400x1800.png?w=3840&q=85&fit=clip&auto=format',
  },
  {
    name: 'Uganda',
    slug: 'uganda',
    description:
      'Gorilla and chimpanzee trekking in Bwindi and Kibale. Safari in Queen Elizabeth and Murchison Falls National Parks.',
    sort_order: 2,
    hero_image:
      'https://destinationuganda.com/wp-content/uploads/2020/09/where-to-go-places-to-visit-uganda-trip-1024x683.jpg',
  },
  {
    name: 'Kenya',
    slug: 'kenya',
    description:
      'Safari in Maasai Mara and Amboseli National Parks. Visit the Great Rift Valley and the coastal beaches.',
    sort_order: 3,
    hero_image: 'https://s1.it.atcdn.net/wp-content/uploads/2020/04/HEROMaasaiMara.jpg',
  },
  {
    name: 'Tanzania',
    slug: 'tanzania',
    description:
      'Safari in Serengeti and Ngorongoro Crater. Visit the Great Rift Valley and the coastal beaches.',
    sort_order: 4,
    hero_image: 'https://www.micato.com/wp-content/uploads/2018/09/mt-kilimanjaro.jpg',
  },
];

export class DestinationSeeder implements EntitySeeder {
  async run(db: EntityManager): Promise<void> {
    for (const row of SEED_DESTINATIONS) {
      let destination = await db.findOne(Destination, { where: { slug: row.slug } });
      if (destination) {
        destination.name = row.name;
        destination.description = row.description;
        destination.sort_order = row.sort_order;
        destination.hero_image = row.hero_image;
        await db.save(destination);
      } else {
        destination = db.create(Destination, {
          name: row.name,
          slug: row.slug,
          description: row.description,
          is_active: true,
          sort_order: row.sort_order,
          hero_image: row.hero_image,
        });
        await db.save(destination);
      }
    }
    console.log('Destinations seeded successfully');
  }
}
