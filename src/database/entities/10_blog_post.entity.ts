import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { User } from './1_user.entity';

export enum BlogPostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

@Entity('BlogPost')
@Index(['status'])
@Index(['published_at'])
@Index(['author_id'])
export class BlogPost extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  slug: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  excerpt?: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  content: string;

  @Column({
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  featured_image?: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  is_featured: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  published_at?: number;

  @Column({
    type: 'enum',
    enum: BlogPostStatus,
    default: BlogPostStatus.DRAFT,
    nullable: false,
  })
  status: BlogPostStatus;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
  })
  view_count: number;

  @Column({
    type: 'bigint',
    nullable: false,
  })
  author_id: number;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
