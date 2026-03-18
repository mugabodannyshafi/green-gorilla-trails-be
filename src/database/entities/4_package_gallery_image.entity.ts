import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';

@Entity('PackageGalleryImage')
export class PackageGalleryImage extends EntityModel {
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
    type: 'varchar',
    length: 2048,
    nullable: false,
  })
  url: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  alt?: string;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
  })
  sort_order: number;
}
