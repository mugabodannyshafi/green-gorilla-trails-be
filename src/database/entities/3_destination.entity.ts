import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';

@Entity('Destination')
export class Destination extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @OneToMany(() => Package, (pkg) => pkg.destination)
  packages: Package[];

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  hero_image?: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  is_active: boolean;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
  })
  sort_order: number;
}
