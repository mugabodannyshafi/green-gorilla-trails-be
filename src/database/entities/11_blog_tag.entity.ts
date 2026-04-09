import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EntityModel } from './entityModel';
import { BlogPostTag } from './12_blog_post_tag.entity';

@Entity('BlogTag')
export class BlogTag extends EntityModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @OneToMany(() => BlogPostTag, (postTag) => postTag.tag)
  post_tags: BlogPostTag[];

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
}
