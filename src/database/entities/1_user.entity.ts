import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EntityModel } from './entityModel';
import { BlogPost } from './10_blog_post.entity';

@Entity('User')
export class User extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @OneToMany(() => BlogPost, (post) => post.author)
  posts: BlogPost[];

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    unique: true,
  })
  phone: string;

  @Column({ type: 'varchar', length: 255, select: false, nullable: false })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'text', nullable: false })
  profile_photo_url: string;

  @Column({
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  otp?: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  otp_expires_at?: number;

  @Column({
    type: 'int',
    default: 0,
    nullable: false,
  })
  otp_attempts: number;

  @Column({ type: 'int', nullable: true })
  last_login_at: number;
}
