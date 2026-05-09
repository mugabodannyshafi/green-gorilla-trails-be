import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AdminSeeder } from './database/seeders/admin.seeder';
import { DestinationSeeder } from './database/seeders/destination.seeder';
import { PackageSeeder } from './database/seeders/package.seeder';
import { parseEnvBool } from './database/utils/parse-env-bool';

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
    const runSeeders = parseEnvBool(
      process.env.RUN_APP_BOOTSTRAP_SEEDERS,
      process.env.NODE_ENV !== 'production',
    );
    if (!runSeeders) {
      console.log(
        '[Bootstrap] Seeders skipped. Set RUN_APP_BOOTSTRAP_SEEDERS=true for a one-time or dev fill (see DEPLOYMENT.md).',
      );
      return;
    }
    await this.destinationSeeder.run(this.db);
    await this.packageSeeder.run(this.db);
    await this.adminSeeder.run(this.db);
  }
}
