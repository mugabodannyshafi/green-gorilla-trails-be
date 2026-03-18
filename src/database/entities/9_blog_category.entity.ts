import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { BlogPost } from './10_blog_post.entity';

@Entity('BlogCategory')
export class BlogCategory extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @OneToMany(() => BlogPost, (post) => post.category)
  posts: BlogPost[];

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
    unique: true,
  })
  slug: string;

  @Column({
    type: 'int',
    nullable: false,
    default: 0,
  })
  sort_order: number;
}
