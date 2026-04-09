import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { PackageItineraryDay } from './5_package_itinerary_day.entity';

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
}

@Entity('PackageActivity')
@Index(['itinerary_day_id'])
export class PackageActivity extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  itinerary_day_id: number;

  @ManyToOne(() => PackageItineraryDay, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itinerary_day_id' })
  itineraryDay: PackageItineraryDay;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;
}
