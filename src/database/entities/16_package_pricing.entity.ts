import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';
import { PackageAccommodationTier } from './17_package_accommodation_option.entity';

@Entity('PackagePricing')
@Index(['package_id'])
@Index(['package_id', 'tier', 'pax'])
@Index(['package_id', 'tier', 'is_single_supplement'])
export class PackagePricing extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  package_id: number;

  @ManyToOne(() => Package, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @Column({
    type: 'enum',
    enum: PackageAccommodationTier,
    nullable: false,
  })
  tier: PackageAccommodationTier;

  @Column({
    type: 'int',
    nullable: true,
  })
  pax?: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  is_single_supplement: boolean;
}
