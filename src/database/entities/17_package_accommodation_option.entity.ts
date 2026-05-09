import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';

export enum PackageAccommodationTier {
  STANDARD = 'STANDARD',
  MIDRANGE = 'MIDRANGE',
  LUXURY = 'LUXURY',
}

@Entity('PackageAccommodationOption')
@Index(['package_id'])
@Index(['package_id', 'tier'])
export class PackageAccommodationOption extends EntityModel {
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
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;
}
