import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BaseController, PaginationData } from '@rwanda360/rwanda360-service-sdk';
import { GetPaginationData } from 'src/common/decorators/get-pagination-data.decorator';
import { PackageStatus } from 'src/database/entities/2_package.entity';

@ApiTags('Packages')
@Controller('packages')
export class PackageController extends BaseController {
  constructor(private readonly packageService: PackageService) {
    super();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a package' })
  @ApiBody({ type: CreatePackageDto, description: 'Package and nested data' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - validation or destination not found' })
  async create(@Body() dto: CreatePackageDto) {
    const pkg = await this.packageService.create(dto);
    return this.successMessageResponse('Package created successfully', { id: Number(pkg.id) });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload package gallery images' })
  @ApiParam({ name: 'id', type: Number, description: 'Package id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload one or more images using multipart/form-data under the `images` field',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['images'],
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - validation or package not found' })
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPackageImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const result = await this.packageService.addPackageImages(id, files);
    return this.successMessageResponse('Images uploaded successfully', result);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: Number,
    example: 10,
    description: 'Number of records per page',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search by package title',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PackageStatus,
    description: 'Filter by package status',
  })
  @ApiQuery({
    name: 'destination',
    required: false,
    type: Number,
    description: 'Filter by destination ID',
  })
  @ApiOperation({ summary: 'Get all packages' })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  async getAllPackages(
    @GetPaginationData() pagination: PaginationData,
    @Query('status') status?: PackageStatus,
    @Query('destination') destination?: number,
  ) {
    return await this.packageService.getAllPackages(pagination, status, destination);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a big package' })
  @ApiParam({ name: 'id', type: Number, description: 'Package id' })
  @ApiResponse({ status: 200, description: 'Package retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - package not found' })
  async getBigPackage(@Param('id', ParseIntPipe) id: number) {
    return await this.packageService.getPackageById(id);
  }
}
