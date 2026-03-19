import { EntityManager } from 'typeorm';
import { EntitySeeder } from './seeder';
import { BlogTag } from '../entities/11_blog_tag.entity';

const SEED_TAGS: Array<{ name: string; slug: string }> = [
  { name: 'Gorilla Trekking', slug: 'gorilla-trekking' },
  { name: 'Safari', slug: 'safari' },
  { name: 'Conservation', slug: 'conservation' },
  { name: 'Travel Guide', slug: 'travel-guide' },
];

export class BlogTagSeeder implements EntitySeeder {
  async run(db: EntityManager): Promise<void> {
    for (const row of SEED_TAGS) {
      let tag = await db.findOne(BlogTag, { where: { slug: row.slug } });
      if (tag) {
        tag.name = row.name;
        await db.save(tag);
      } else {
        tag = db.create(BlogTag, { name: row.name, slug: row.slug });
        await db.save(tag);
      }
    }
    console.log('Blog tags seeded successfully');
  }
}
