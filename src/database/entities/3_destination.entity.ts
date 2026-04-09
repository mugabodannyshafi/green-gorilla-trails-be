import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';

@Entity('Destination')
export class Destination extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

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
