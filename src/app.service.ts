import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AdminSeeder } from './database/seeders/admin.seeder';

@Injectable()
export class AppService {
  constructor(
    @InjectEntityManager()
    protected readonly db: EntityManager,
    protected readonly adminSeeder: AdminSeeder,
  ) {}
  getHello(): string {
    return 'Welcome to your NestJS application built with nestify!';
  }

  async onApplicationBootstrap() {
    await this.adminSeeder.run(this.db);
  }
}
