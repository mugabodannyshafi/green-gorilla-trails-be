import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseController, PaginationData } from '@rwanda360/rwanda360-service-sdk';
import { BlogsService } from './blogs.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { GetPaginationData } from 'src/common/decorators/get-pagination-data.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetLoggedInUserId } from 'src/common/decorators/get-logged-in-user.decorator';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController extends BaseController {
  constructor(private readonly blogsService: BlogsService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List published blog posts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: Number,
    example: 10,
    description: 'Records per page',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search title or excerpt',
  })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async listPublishedPosts(
    @GetPaginationData() pagination: PaginationData,
    @Query('query') query?: string,
  ) {
    return await this.blogsService.listPublishedPosts(pagination, query);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a published post by slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Post URL slug' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostBySlug(@Param('slug') slug: string) {
    return await this.blogsService.getPublishedPostBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a blog post' })
  @ApiBody({ type: CreateBlogPostDto })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(@GetLoggedInUserId() authorId: number, @Body() dto: CreateBlogPostDto) {
    const post = await this.blogsService.createPost(authorId, dto);
    return this.successMessageResponse('Blog post created successfully', {
      id: Number(post.id),
      slug: post.slug,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a blog post (author only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Post id' })
  @ApiBody({ type: UpdateBlogPostDto })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the author' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @GetLoggedInUserId() authorId: number,
    @Body() dto: UpdateBlogPostDto,
  ) {
    const post = await this.blogsService.updatePost(id, authorId, dto);
    return this.successMessageResponse('Blog post updated successfully', {
      id: Number(post.id),
      slug: post.slug,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a blog post (author only)' })
  @ApiParam({ name: 'id', type: Number, description: 'Post id' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the author' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Param('id', ParseIntPipe) id: number, @GetLoggedInUserId() authorId: number) {
    await this.blogsService.deletePost(id, authorId);
    return this.successMessageResponse('Blog post deleted successfully', { id });
  }
}
