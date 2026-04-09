import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { EntityModel } from './entityModel';
import { PackageItineraryDay } from './5_package_itinerary_day.entity';

export enum AccommodationTier {
  MIDRANGE = 'MIDRANGE',
  LUXURY = 'LUXURY',
  HIGH_END = 'HIGH_END',
}

@Entity('PackageDayAccommodation')
@Index(['itinerary_day_id'])
@Index(['itinerary_day_id', 'tier'])
export class PackageDayAccommodation extends EntityModel {
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
    type: 'enum',
    enum: AccommodationTier,
    nullable: false,
  })
  tier: AccommodationTier;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;
}
