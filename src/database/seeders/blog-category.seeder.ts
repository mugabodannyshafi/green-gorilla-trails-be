import { EntityManager } from 'typeorm';
import { EntitySeeder } from './seeder';
import { BlogCategory } from '../entities/9_blog_category.entity';

const SEED_CATEGORIES: Array<{ name: string; slug: string; sort_order: number }> = [
  { name: 'Travel Tips', slug: 'travel-tips', sort_order: 0 },
  { name: 'Wildlife', slug: 'wildlife', sort_order: 1 },
  { name: 'Destinations', slug: 'destinations', sort_order: 2 },
];

export class BlogCategorySeeder implements EntitySeeder {
  async run(db: EntityManager): Promise<void> {
    for (const row of SEED_CATEGORIES) {
      let category = await db.findOne(BlogCategory, { where: { slug: row.slug } });
      if (category) {
        category.name = row.name;
        category.sort_order = row.sort_order;
        await db.save(category);
      } else {
        category = db.create(BlogCategory, {
          name: row.name,
          slug: row.slug,
          sort_order: row.sort_order,
        });
        await db.save(category);
      }
    }
    console.log('Blog categories seeded successfully');
  }
}
