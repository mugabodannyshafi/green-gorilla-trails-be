import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityModel } from './entityModel';
import { User } from './1_user.entity';
import { BlogCategory } from './9_blog_category.entity';
import { BlogPostTag } from './12_blog_post_tag.entity';

export enum BlogPostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

@Entity('BlogPost')
@Index(['status'])
@Index(['published_at'])
@Index(['author_id'])
@Index(['category_id'])
export class BlogPost extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @OneToMany(() => BlogPostTag, (postTag) => postTag.post)
  post_tags: BlogPostTag[];

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

  @Column({
    type: 'bigint',
    nullable: false,
  })
  category_id: number;

  @ManyToOne(() => BlogCategory, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: BlogCategory;
}
