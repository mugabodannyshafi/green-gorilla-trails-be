import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BlogPost } from './10_blog_post.entity';
import { BlogTag } from './11_blog_tag.entity';

@Entity('BlogPostTag')
@Index(['post_id'])
@Index(['tag_id'])
export class BlogPostTag {
  @PrimaryColumn({ type: 'bigint' })
  post_id: number;

  @PrimaryColumn({ type: 'bigint' })
  tag_id: number;

  @ManyToOne(() => BlogPost, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: BlogPost;

  @ManyToOne(() => BlogTag, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag: BlogTag;
}
