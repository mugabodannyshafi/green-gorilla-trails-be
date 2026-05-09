import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AdminSeeder } from './database/seeders/admin.seeder';
import { DestinationSeeder } from './database/seeders/destination.seeder';
import { PackageSeeder } from './database/seeders/package.seeder';

@Injectable()
export class AppService {
  constructor(
    @InjectEntityManager()
    protected readonly db: EntityManager,
    protected readonly adminSeeder: AdminSeeder,
    protected readonly destinationSeeder: DestinationSeeder,
    protected readonly packageSeeder: PackageSeeder,
  ) {}

  getHello(): string {
    return 'Welcome to your NestJS application built with nestify!';
  }

  async onApplicationBootstrap() {
    await this.destinationSeeder.run(this.db);
    if (process.env.NODE_ENV !== 'production') {
      await this.packageSeeder.run(this.db);
    }
    await this.adminSeeder.run(this.db);
  }
}
