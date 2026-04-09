import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { DestinationModule } from './modules/destination/destination.module';
import { PackageModule } from './modules/package/package.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminSeeder } from './database/seeders/admin.seeder';
import { DestinationSeeder } from './database/seeders/destination.seeder';
import { PackageSeeder } from './database/seeders/package.seeder';
import { BlogsModule } from './modules/blogs/blogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    DatabaseModule,
    EmailModule,
    AuthModule,
    PackageModule,
    DestinationModule,
    AdminDashboardModule,
    BookingsModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AdminSeeder,
    DestinationSeeder,
    PackageSeeder,
  ],
})
export class AppModule {}
