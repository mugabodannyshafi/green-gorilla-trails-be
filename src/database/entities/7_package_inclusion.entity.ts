import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';

@Entity('PackageInclusion')
@Index(['package_id'])
export class PackageInclusion extends EntityModel {
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
    type: 'text',
    nullable: false,
  })
  text: string;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
  })
  sort_order: number;
}
