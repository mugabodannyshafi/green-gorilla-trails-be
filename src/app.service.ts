import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AdminSeeder } from './database/seeders/admin.seeder';
import { BlogCategorySeeder } from './database/seeders/blog-category.seeder';
import { BlogTagSeeder } from './database/seeders/blog-tag.seeder';
import { DestinationSeeder } from './database/seeders/destination.seeder';

@Injectable()
export class AppService {
  constructor(
    @InjectEntityManager()
    protected readonly db: EntityManager,
    protected readonly adminSeeder: AdminSeeder,
    protected readonly destinationSeeder: DestinationSeeder,
    protected readonly blogCategorySeeder: BlogCategorySeeder,
    protected readonly blogTagSeeder: BlogTagSeeder,
  ) {}

  getHello(): string {
    return 'Welcome to your NestJS application built with nestify!';
  }

  async onApplicationBootstrap() {
    await this.destinationSeeder.run(this.db);
    await this.blogCategorySeeder.run(this.db);
    await this.blogTagSeeder.run(this.db);
    await this.adminSeeder.run(this.db);
  }
}
