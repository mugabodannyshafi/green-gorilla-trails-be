import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';

export enum ContactSubjectKey {
  GENERAL = 'GENERAL',
  GORILLA = 'GORILLA',
  SAFARI = 'SAFARI',
  OTHER = 'OTHER',
}

export enum ContactEnquiryStatus {
  NEW = 'NEW',
  HANDLED = 'HANDLED',
}

@Entity('ContactEnquiry')
@Index(['email'])
@Index(['status'])
export class ContactEnquiry extends EntityModel {
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
  })
  email: string;

  @Column({
    type: 'enum',
    enum: ContactSubjectKey,
    nullable: false,
  })
  subject_key: ContactSubjectKey;

  @Column({
    type: 'text',
    nullable: false,
  })
  message: string;

  @Column({
    type: 'enum',
    enum: ContactEnquiryStatus,
    nullable: false,
    default: ContactEnquiryStatus.NEW,
  })
  status: ContactEnquiryStatus;
}
