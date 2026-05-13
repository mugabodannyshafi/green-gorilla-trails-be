import { EntityManager } from 'typeorm';
import { EntitySeeder } from './seeder';
import { User } from '../entities/1_user.entity';
import * as bcrypt from 'bcryptjs';

export class AdminSeeder implements EntitySeeder {
  async run(db: EntityManager): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    const adminPhone = process.env.ADMIN_PHONE ?? '0000000000';
    const adminProfilePhotoUrl = process.env.ADMIN_PROFILE_PHOTO_URL ?? '';

    if (!adminEmail || !adminPassword) {
      console.warn(
        '[AdminSeeder] Skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create or update the system admin.',
      );
      return;
    }

    let admin = await db.findOne(User, {
      where: { email: adminEmail },
      withDeleted: true,
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (admin) {
      admin.first_name = 'System';
      admin.last_name = 'Admin';
      admin.password = hashedPassword;

      // Only populate optional-looking fields if they're missing.
      // This keeps the seeder idempotent for existing admins.
      if (!admin.phone) admin.phone = adminPhone;
      if (!admin.profile_photo_url) admin.profile_photo_url = adminProfilePhotoUrl;

      await db.save(admin);
    } else {
      admin = db.create(User, {
        email: adminEmail,
        phone: adminPhone,
        profile_photo_url: adminProfilePhotoUrl,
        first_name: 'System',
        last_name: 'Admin',
        password: hashedPassword,
      });

      await db.save(admin);
    }
    console.log('Admin user seeded successfully');
  }
}
