import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Package } from './2_package.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('Booking')
@Index(['package_id'])
@Index(['travel_date'])
@Index(['status'])
export class Booking extends EntityModel {
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
    type: 'int',
    nullable: false,
  })
  travel_date: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  customer_name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    type: 'int',
    nullable: false,
  })
  number_of_guests: number;

  @Column({
    type: 'int',
    nullable: false,
  })
  number_of_days: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  special_requests?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  message?: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    nullable: false,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;
}
