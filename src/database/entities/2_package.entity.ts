import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Destination } from './3_destination.entity';
import { PackageInclusion } from './7_package_inclusion.entity';
import { PackageExclusion } from './8_package_exclusion.entity';
import { PackageItineraryDay } from './5_package_itinerary_day.entity';
import { PackagePricing } from './16_package_pricing.entity';

export enum PackageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('Package')
export class Package extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  destination_id: number;

  @ManyToOne(() => Destination, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'destination_id' })
  destination: Destination;

  @OneToMany(() => PackageInclusion, (inclusion) => inclusion.package)
  inclusions: PackageInclusion[];

  @OneToMany(() => PackageExclusion, (exclusion) => exclusion.package)
  exclusions: PackageExclusion[];

  @OneToMany(() => PackageItineraryDay, (itineraryDay) => itineraryDay.package)
  itinerary_days: PackageItineraryDay[];

  @OneToMany(() => PackagePricing, (pricing) => pricing.package)
  pricing: PackagePricing[];

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  short_description?: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  overview?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  featured_image?: string;

  @Column({
    type: 'int',
    nullable: false,
  })
  duration_days: number;

  @Column({
    type: 'int',
    nullable: false,
    default: 1,
  })
  min_pax: number;

  @Column({
    type: 'int',
    nullable: false,
    default: 6,
  })
  max_pax: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  travel_year: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  difficulty_level?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  base_price: string;

  @Column({
    type: 'varchar',
    length: 3,
    nullable: false,
    default: 'USD',
  })
  currency: string;

  @Column({
    type: 'enum',
    enum: PackageStatus,
    default: PackageStatus.DRAFT,
    nullable: false,
  })
  status: PackageStatus;
}
