import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';
import { MealType } from './18_package_activity.entity';
import { PackageActivity } from './18_package_activity.entity';

@Entity('PackageItineraryDay')
export class PackageItineraryDay extends EntityModel {
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

  @OneToMany(() => PackageActivity, (activity) => activity.itineraryDay)
  activities: PackageActivity[];

  @Column({
    type: 'int',
    nullable: false,
  })
  day_number: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  meals?: MealType[];
}
