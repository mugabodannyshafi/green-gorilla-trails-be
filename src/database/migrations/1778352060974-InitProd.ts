import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitProd1778352060974 implements MigrationInterface {
  name = 'InitProd1778352060974';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`Destination\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`hero_image\` varchar(255) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`sort_order\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_538aae18b6354bbdaf9050c865\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageInclusion\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`text\` text NOT NULL, \`sort_order\` int NOT NULL DEFAULT '0', INDEX \`IDX_e3f8ad9197e505ee641e4506b7\` (\`package_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageActivity\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`itinerary_day_id\` bigint NOT NULL, \`name\` varchar(255) NOT NULL, INDEX \`IDX_afe6d49920e708fc0f4655a0ab\` (\`itinerary_day_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageItineraryDay\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`day_number\` int NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`meals\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageAccommodationOption\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`tier\` enum ('STANDARD', 'MIDRANGE', 'LUXURY') NOT NULL, \`name\` varchar(255) NOT NULL, INDEX \`IDX_debc8d7e8e5213d2c16397014b\` (\`package_id\`, \`tier\`), INDEX \`IDX_713fd24f98a22f4659051a564a\` (\`package_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackagePricing\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`tier\` enum ('STANDARD', 'MIDRANGE', 'LUXURY') NOT NULL, \`pax\` int NULL, \`price\` decimal(10,2) NOT NULL, \`is_single_supplement\` tinyint NOT NULL DEFAULT 0, INDEX \`IDX_fdfbc7de05807a42f54601bc90\` (\`package_id\`, \`tier\`, \`is_single_supplement\`), INDEX \`IDX_780da015aee0624cc54541546e\` (\`package_id\`, \`tier\`, \`pax\`), INDEX \`IDX_b643f6789f8f8d3711eb195050\` (\`package_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Package\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`destination_id\` bigint NOT NULL, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`short_description\` varchar(255) NULL, \`description\` text NOT NULL, \`overview\` text NULL, \`featured_image\` varchar(255) NULL, \`duration_days\` int NOT NULL, \`min_pax\` int NOT NULL DEFAULT '1', \`max_pax\` int NOT NULL DEFAULT '6', \`travel_year\` int NOT NULL, \`difficulty_level\` varchar(50) NULL, \`base_price\` decimal(10,2) NOT NULL, \`currency\` varchar(3) NOT NULL DEFAULT 'USD', \`status\` enum ('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT', UNIQUE INDEX \`IDX_7859e3c6dfccec20cabe020fef\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageExclusion\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`text\` text NOT NULL, \`sort_order\` int NOT NULL DEFAULT '0', INDEX \`IDX_c54abb24b98d19df239b50f62a\` (\`package_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageDayAccommodation\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`itinerary_day_id\` bigint NOT NULL, \`tier\` enum ('STANDARD', 'MIDRANGE', 'LUXURY') NOT NULL, \`name\` varchar(255) NOT NULL, INDEX \`IDX_cb841f31dc39ea7444415bce72\` (\`itinerary_day_id\`, \`tier\`), INDEX \`IDX_55b5b289c0c53d507f47168de1\` (\`itinerary_day_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`PackageGalleryImage\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`url\` varchar(2048) NOT NULL, \`alt\` varchar(255) NULL, \`sort_order\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`BlogPost\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`slug\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`excerpt\` text NULL, \`content\` text NOT NULL, \`featured_image\` varchar(2048) NULL, \`is_featured\` tinyint NOT NULL DEFAULT 0, \`published_at\` int NULL, \`status\` enum ('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT', \`view_count\` int NOT NULL DEFAULT '0', \`author_id\` bigint NOT NULL, INDEX \`IDX_4d634c06bd5bcb14dc71e7034f\` (\`author_id\`), INDEX \`IDX_3820629dd5243ad2ae256670c3\` (\`published_at\`), INDEX \`IDX_bdd70a77116ad4d990b41f5b2f\` (\`status\`), UNIQUE INDEX \`IDX_ca8db9c404a70c03f5d1d4b2e4\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`User\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`phone\` varchar(20) NOT NULL, \`password\` varchar(255) NOT NULL, \`first_name\` varchar(100) NOT NULL, \`last_name\` varchar(100) NOT NULL, \`profile_photo_url\` text NOT NULL, \`otp\` varchar(6) NULL, \`otp_expires_at\` bigint NULL, \`otp_attempts\` int NOT NULL DEFAULT '0', \`last_login_at\` int NULL, UNIQUE INDEX \`IDX_4a257d2c9837248d70640b3e36\` (\`email\`), UNIQUE INDEX \`IDX_1f5c894f79cd0159ff4e1a4450\` (\`phone\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`Booking\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`package_id\` bigint NOT NULL, \`travel_date\` int NOT NULL, \`customer_name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`number_of_guests\` int NOT NULL, \`number_of_days\` int NOT NULL, \`special_requests\` text NULL, \`message\` text NULL, \`status\` enum ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING', INDEX \`IDX_532cd389ca1896cd64a66fdadf\` (\`status\`), INDEX \`IDX_637903fdddaa46a2b37a6decf9\` (\`travel_date\`), INDEX \`IDX_d64f4d375af7ed398ec09a149b\` (\`package_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`BookingGuest\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`booking_id\` bigint NOT NULL, \`name\` varchar(255) NOT NULL, \`age\` int NULL, \`dietary_requirements\` text NULL, \`special_requests\` text NULL, INDEX \`IDX_d280dedfbfdbe33b74d72906c0\` (\`booking_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ContactEnquiry\` (\`created_at\` int NOT NULL, \`updated_at\` int NULL, \`id\` bigint NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`subject_key\` enum ('GENERAL', 'GORILLA', 'SAFARI', 'OTHER') NOT NULL, \`message\` text NOT NULL, \`status\` enum ('NEW', 'HANDLED') NOT NULL DEFAULT 'NEW', INDEX \`IDX_167b84d91ea9af9a22056e601e\` (\`status\`), INDEX \`IDX_a8c0f094749bbc43158923c0ed\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageInclusion\` ADD CONSTRAINT \`FK_e3f8ad9197e505ee641e4506b71\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageActivity\` ADD CONSTRAINT \`FK_afe6d49920e708fc0f4655a0ab4\` FOREIGN KEY (\`itinerary_day_id\`) REFERENCES \`PackageItineraryDay\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageItineraryDay\` ADD CONSTRAINT \`FK_ef13efe9b7361bd85e63463469e\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageAccommodationOption\` ADD CONSTRAINT \`FK_713fd24f98a22f4659051a564a6\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackagePricing\` ADD CONSTRAINT \`FK_b643f6789f8f8d3711eb1950504\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`Package\` ADD CONSTRAINT \`FK_2077dbb0d71134e230929bbfcc6\` FOREIGN KEY (\`destination_id\`) REFERENCES \`Destination\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageExclusion\` ADD CONSTRAINT \`FK_c54abb24b98d19df239b50f62a9\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageDayAccommodation\` ADD CONSTRAINT \`FK_55b5b289c0c53d507f47168de1f\` FOREIGN KEY (\`itinerary_day_id\`) REFERENCES \`PackageItineraryDay\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageGalleryImage\` ADD CONSTRAINT \`FK_9610607716258d1c1853a6586e6\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BlogPost\` ADD CONSTRAINT \`FK_4d634c06bd5bcb14dc71e7034f7\` FOREIGN KEY (\`author_id\`) REFERENCES \`User\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`Booking\` ADD CONSTRAINT \`FK_d64f4d375af7ed398ec09a149bd\` FOREIGN KEY (\`package_id\`) REFERENCES \`Package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`BookingGuest\` ADD CONSTRAINT \`FK_d280dedfbfdbe33b74d72906c0d\` FOREIGN KEY (\`booking_id\`) REFERENCES \`Booking\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`BookingGuest\` DROP FOREIGN KEY \`FK_d280dedfbfdbe33b74d72906c0d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`Booking\` DROP FOREIGN KEY \`FK_d64f4d375af7ed398ec09a149bd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`BlogPost\` DROP FOREIGN KEY \`FK_4d634c06bd5bcb14dc71e7034f7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageGalleryImage\` DROP FOREIGN KEY \`FK_9610607716258d1c1853a6586e6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageDayAccommodation\` DROP FOREIGN KEY \`FK_55b5b289c0c53d507f47168de1f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageExclusion\` DROP FOREIGN KEY \`FK_c54abb24b98d19df239b50f62a9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`Package\` DROP FOREIGN KEY \`FK_2077dbb0d71134e230929bbfcc6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackagePricing\` DROP FOREIGN KEY \`FK_b643f6789f8f8d3711eb1950504\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageAccommodationOption\` DROP FOREIGN KEY \`FK_713fd24f98a22f4659051a564a6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageItineraryDay\` DROP FOREIGN KEY \`FK_ef13efe9b7361bd85e63463469e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageActivity\` DROP FOREIGN KEY \`FK_afe6d49920e708fc0f4655a0ab4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`PackageInclusion\` DROP FOREIGN KEY \`FK_e3f8ad9197e505ee641e4506b71\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_a8c0f094749bbc43158923c0ed\` ON \`ContactEnquiry\``);
    await queryRunner.query(`DROP INDEX \`IDX_167b84d91ea9af9a22056e601e\` ON \`ContactEnquiry\``);
    await queryRunner.query(`DROP TABLE \`ContactEnquiry\``);
    await queryRunner.query(`DROP INDEX \`IDX_d280dedfbfdbe33b74d72906c0\` ON \`BookingGuest\``);
    await queryRunner.query(`DROP TABLE \`BookingGuest\``);
    await queryRunner.query(`DROP INDEX \`IDX_d64f4d375af7ed398ec09a149b\` ON \`Booking\``);
    await queryRunner.query(`DROP INDEX \`IDX_637903fdddaa46a2b37a6decf9\` ON \`Booking\``);
    await queryRunner.query(`DROP INDEX \`IDX_532cd389ca1896cd64a66fdadf\` ON \`Booking\``);
    await queryRunner.query(`DROP TABLE \`Booking\``);
    await queryRunner.query(`DROP INDEX \`IDX_1f5c894f79cd0159ff4e1a4450\` ON \`User\``);
    await queryRunner.query(`DROP INDEX \`IDX_4a257d2c9837248d70640b3e36\` ON \`User\``);
    await queryRunner.query(`DROP TABLE \`User\``);
    await queryRunner.query(`DROP INDEX \`IDX_ca8db9c404a70c03f5d1d4b2e4\` ON \`BlogPost\``);
    await queryRunner.query(`DROP INDEX \`IDX_bdd70a77116ad4d990b41f5b2f\` ON \`BlogPost\``);
    await queryRunner.query(`DROP INDEX \`IDX_3820629dd5243ad2ae256670c3\` ON \`BlogPost\``);
    await queryRunner.query(`DROP INDEX \`IDX_4d634c06bd5bcb14dc71e7034f\` ON \`BlogPost\``);
    await queryRunner.query(`DROP TABLE \`BlogPost\``);
    await queryRunner.query(`DROP TABLE \`PackageGalleryImage\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_55b5b289c0c53d507f47168de1\` ON \`PackageDayAccommodation\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_cb841f31dc39ea7444415bce72\` ON \`PackageDayAccommodation\``,
    );
    await queryRunner.query(`DROP TABLE \`PackageDayAccommodation\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c54abb24b98d19df239b50f62a\` ON \`PackageExclusion\``,
    );
    await queryRunner.query(`DROP TABLE \`PackageExclusion\``);
    await queryRunner.query(`DROP INDEX \`IDX_7859e3c6dfccec20cabe020fef\` ON \`Package\``);
    await queryRunner.query(`DROP TABLE \`Package\``);
    await queryRunner.query(`DROP INDEX \`IDX_b643f6789f8f8d3711eb195050\` ON \`PackagePricing\``);
    await queryRunner.query(`DROP INDEX \`IDX_780da015aee0624cc54541546e\` ON \`PackagePricing\``);
    await queryRunner.query(`DROP INDEX \`IDX_fdfbc7de05807a42f54601bc90\` ON \`PackagePricing\``);
    await queryRunner.query(`DROP TABLE \`PackagePricing\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_713fd24f98a22f4659051a564a\` ON \`PackageAccommodationOption\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_debc8d7e8e5213d2c16397014b\` ON \`PackageAccommodationOption\``,
    );
    await queryRunner.query(`DROP TABLE \`PackageAccommodationOption\``);
    await queryRunner.query(`DROP TABLE \`PackageItineraryDay\``);
    await queryRunner.query(`DROP INDEX \`IDX_afe6d49920e708fc0f4655a0ab\` ON \`PackageActivity\``);
    await queryRunner.query(`DROP TABLE \`PackageActivity\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e3f8ad9197e505ee641e4506b7\` ON \`PackageInclusion\``,
    );
    await queryRunner.query(`DROP TABLE \`PackageInclusion\``);
    await queryRunner.query(`DROP INDEX \`IDX_538aae18b6354bbdaf9050c865\` ON \`Destination\``);
    await queryRunner.query(`DROP TABLE \`Destination\``);
  }
}
