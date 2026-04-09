import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { Booking } from './14_booking.entity';

@Entity('BookingGuest')
@Index(['booking_id'])
export class BookingGuest extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  booking_id: number;

  @ManyToOne(() => Booking, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  age?: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  dietary_requirements?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  special_requests?: string;
}
