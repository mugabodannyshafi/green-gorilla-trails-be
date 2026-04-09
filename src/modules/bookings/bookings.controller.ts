import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, BookingStatus } from '../../database/entities/14_booking.entity';
import { BaseController, PaginationData } from '@rwanda360/rwanda360-service-sdk';
import { GetPaginationData } from 'src/common/decorators/get-pagination-data.decorator';

@ApiTags('bookings')
@Controller('packages')
export class BookingsController extends BaseController {
  constructor(private readonly bookingsService: BookingsService) {
    super();
  }

  @Post(':packageId/bookings')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: Booking,
    description: 'Booking created successfully',
  })
  async create(
    @Param('packageId', ParseIntPipe) packageId: number,
    @Body() dto: CreateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.create(packageId, dto);
  }

  @Get('bookings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all bookings with pagination and filters' })
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
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'packageId',
    required: false,
    type: Number,
    description: 'Filter by package id',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by customer email (exact match)',
  })
  async getAllBookings(
    @GetPaginationData() pagination: PaginationData,
    @Query('status') status?: BookingStatus,
    @Query('packageId') packageId?: number,
    @Query('email') email?: string,
  ) {
    return this.bookingsService.getAllBookings(
      pagination,
      status,
      packageId ? Number(packageId) : undefined,
      email,
    );
  }
}
