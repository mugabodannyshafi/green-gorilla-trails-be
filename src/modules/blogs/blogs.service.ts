import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, In } from 'typeorm';
import { DateTime } from 'luxon';
import { v2 as cloudinary } from 'cloudinary';
import { BaseService, PaginationData, PaginationResponse } from '@rwanda360/rwanda360-service-sdk';
import { BlogPost, BlogPostStatus } from '../../database/entities/10_blog_post.entity';
import { User } from '../../database/entities/1_user.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogsService extends BaseService {
  private cloudinaryConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
  ) {
    super();
  }

  /**
   * Upload a single image to Cloudinary (featured image or inline editor images).
   */
  async uploadBlogImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file uploaded');
    }

    this.ensureCloudinaryConfigured();

    const folder = 'blog/content';
    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          const u = result?.secure_url || result?.url;
          if (!u) return reject(new Error('Cloudinary did not return a URL'));
          resolve(u);
        },
      );
      stream.end(file.buffer);
    });

    return { url };
  }

  private ensureCloudinaryConfigured(): void {
    if (this.cloudinaryConfigured) return;

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary is not configured');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.cloudinaryConfigured = true;
  }

  async listPublishedPosts(
    pagination: PaginationData,
    searchQuery?: string,
  ): Promise<PaginationResponse> {
    const qb = this.entityManager
      .createQueryBuilder(BlogPost, 'post')
      .where('post.status = :status', { status: BlogPostStatus.PUBLISHED });

    const qTrim = searchQuery?.trim();
    if (qTrim) {
      const like = `%${qTrim}%`;
      qb.andWhere('(post.title LIKE :q OR post.excerpt LIKE :q)', { q: like });
    }

    qb.orderBy('post.published_at', 'DESC').addOrderBy('post.id', 'DESC');

    const count = await qb.clone().getCount();

    const idRows = await qb
      .clone()
      .select('post.id', 'id')
      .skip(pagination.skip)
      .take(pagination.take)
      .getRawMany<{ id: string }>();

    const ids = idRows.map((r) => Number(r.id)).filter((n) => !Number.isNaN(n));
    if (ids.length === 0) {
      return this.paginate([], count, pagination);
    }

    const posts = await this.entityManager.find(BlogPost, {
      where: { id: In(ids) },
      relations: { author: true },
    });
    const byId = new Map(posts.map((p) => [Number(p.id), p]));
    const ordered = ids.map((id) => byId.get(id)).filter((p): p is BlogPost => p != null);

    const items = ordered.map((p) => this.serializePostList(p));
    return this.paginate(items, count, pagination);
  }

  async getPublishedPostBySlug(slug: string): Promise<unknown> {
    const trimmed = String(slug ?? '').trim();
    if (!trimmed) {
      throw new NotFoundException('Post not found');
    }

    const post = await this.entityManager.findOne(BlogPost, {
      where: { slug: trimmed, status: BlogPostStatus.PUBLISHED },
      relations: { author: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.entityManager.increment(BlogPost, { id: post.id }, 'view_count', 1);
    post.view_count += 1;

    return this.serializePostDetail(post);
  }

  /**
   * Paginated list of posts for the authenticated author (draft + published).
   */
  async listPostsForAdmin(
    pagination: PaginationData,
    authorId: number,
    status?: BlogPostStatus,
    searchQuery?: string,
  ): Promise<PaginationResponse> {
    const qb = this.entityManager
      .createQueryBuilder(BlogPost, 'post')
      .where('post.author_id = :authorId', { authorId });

    if (status && String(status).trim() !== '') {
      const st = String(status).toUpperCase() as BlogPostStatus;
      if (!Object.values(BlogPostStatus).includes(st)) {
        qb.andWhere('1=0');
      } else {
        qb.andWhere('post.status = :status', { status: st });
      }
    }

    const qTrim = searchQuery?.trim();
    if (qTrim) {
      const like = `%${qTrim}%`;
      qb.andWhere('(post.title LIKE :q OR post.excerpt LIKE :q)', { q: like });
    }

    qb.orderBy('post.updated_at', 'DESC').addOrderBy('post.id', 'DESC');

    const count = await qb.clone().getCount();

    const idRows = await qb
      .clone()
      .select('post.id', 'id')
      .skip(pagination.skip)
      .take(pagination.take)
      .getRawMany<{ id: string }>();

    const ids = idRows.map((r) => Number(r.id)).filter((n) => !Number.isNaN(n));
    if (ids.length === 0) {
      return this.paginate([], count, pagination);
    }

    const posts = await this.entityManager.find(BlogPost, {
      where: { id: In(ids) },
      relations: { author: true },
    });
    const byId = new Map(posts.map((p) => [Number(p.id), p]));
    const ordered = ids.map((id) => byId.get(id)).filter((p): p is BlogPost => p != null);

    const items = ordered.map((p) => this.serializePostAdminList(p));
    return this.paginate(items, count, pagination);
  }

  async getPostForAuthor(postId: number, authorId: number): Promise<unknown> {
    const post = await this.entityManager.findOne(BlogPost, {
      where: { id: postId },
      relations: { author: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (Number(post.author_id) !== Number(authorId)) {
      throw new ForbiddenException('You can only view your own posts');
    }
    return this.serializePostDetail(post);
  }

  async createPost(authorId: number, dto: CreateBlogPostDto): Promise<BlogPost> {
    return this.entityManager.transaction(async (manager) => {
      const baseSlug = dto.slug?.trim() || this.slugFromTitle(dto.title);
      const slug = await this.resolveSlug(manager, baseSlug);

      const status = dto.status ?? BlogPostStatus.DRAFT;
      const now = DateTime.now().toUnixInteger();
      const published_at = status === BlogPostStatus.PUBLISHED ? now : undefined;

      const entity = manager.create(BlogPost, {
        slug,
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt ?? null,
        featured_image: dto.featured_image ?? null,
        is_featured: dto.is_featured ?? false,
        status,
        published_at,
        view_count: 0,
        author_id: authorId,
      });

      return manager.save(BlogPost, entity);
    });
  }

  async updatePost(postId: number, authorId: number, dto: UpdateBlogPostDto): Promise<BlogPost> {
    const post = await this.entityManager.findOne(BlogPost, { where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (Number(post.author_id) !== Number(authorId)) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.entityManager.transaction(async (manager) => {
      const fresh = await manager.findOne(BlogPost, { where: { id: postId } });
      if (!fresh) {
        throw new NotFoundException('Post not found');
      }

      if (dto.title !== undefined) {
        fresh.title = dto.title;
      }
      if (dto.content !== undefined) {
        fresh.content = dto.content;
      }
      if (dto.excerpt !== undefined) {
        fresh.excerpt = dto.excerpt ?? null;
      }
      if (dto.featured_image !== undefined) {
        fresh.featured_image = dto.featured_image ?? null;
      }
      if (dto.is_featured !== undefined) {
        fresh.is_featured = dto.is_featured;
      }

      if (dto.slug !== undefined && dto.slug.trim() !== '') {
        const next = await this.resolveSlugForUpdate(manager, dto.slug.trim(), fresh.id);
        fresh.slug = next;
      }

      if (dto.status !== undefined) {
        fresh.status = dto.status;
      }

      if (fresh.status === BlogPostStatus.PUBLISHED && fresh.published_at == null) {
        fresh.published_at = DateTime.now().toUnixInteger();
      }

      return manager.save(BlogPost, fresh);
    });
  }

  async deletePost(postId: number, authorId: number): Promise<void> {
    const post = await this.entityManager.findOne(BlogPost, { where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (Number(post.author_id) !== Number(authorId)) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.entityManager.delete(BlogPost, { id: postId });
  }

  private serializeAuthor(author: User): Record<string, unknown> {
    return {
      id: Number(author.id),
      first_name: author.first_name,
      last_name: author.last_name,
    };
  }

  private serializePostList(post: BlogPost): Record<string, unknown> {
    return {
      id: Number(post.id),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? null,
      featured_image: post.featured_image ?? null,
      is_featured: post.is_featured,
      published_at:
        DateTime.fromSeconds(post.published_at ?? 0).toFormat('yyyy-LL-dd, HH:mm') ?? null,
      view_count: post.view_count,
      content: post.content,
      author: post.author ? this.serializeAuthor(post.author) : null,
    };
  }

  /** Admin table row — no full content body. */
  private serializePostAdminList(post: BlogPost): Record<string, unknown> {
    return {
      id: Number(post.id),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? null,
      featured_image: post.featured_image ?? null,
      is_featured: post.is_featured,
      status: post.status,
      published_at:
        post.published_at != null && post.published_at > 0
          ? DateTime.fromSeconds(post.published_at).toFormat('yyyy-LL-dd, HH:mm')
          : null,
      view_count: post.view_count,
      author: post.author ? this.serializeAuthor(post.author) : null,
    };
  }

  private serializePostDetail(post: BlogPost): Record<string, unknown> {
    return {
      ...this.serializePostList(post),
      status: post.status,
      content: post.content,
    };
  }

  private slugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  private async resolveSlug(manager: EntityManager, baseSlug: string): Promise<string> {
    if (!baseSlug) {
      baseSlug = 'post';
    }
    let slug = baseSlug;
    let suffix = 0;
    while (await manager.findOne(BlogPost, { where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    return slug;
  }

  private async resolveSlugForUpdate(
    manager: EntityManager,
    baseSlug: string,
    excludePostId: number,
  ): Promise<string> {
    if (!baseSlug) {
      baseSlug = 'post';
    }
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const existing = await manager.findOne(BlogPost, { where: { slug } });
      if (!existing || Number(existing.id) === Number(excludePostId)) {
        return slug;
      }
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
  }
}
