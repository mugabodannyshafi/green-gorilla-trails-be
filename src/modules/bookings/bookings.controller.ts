import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from '../../database/entities/14_booking.entity';
import { BaseController, PaginationData } from '@rwanda360/rwanda360-service-sdk';
import { GetPaginationData } from 'src/common/decorators/get-pagination-data.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a booking by id (includes package relation)' })
  @ApiParam({ name: 'id', type: Number, description: 'Booking id' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBookingById(@Param('id', ParseIntPipe) id: number): Promise<Booking> {
    return this.bookingsService.getBookingById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a booking (status, guests, message, special requests)' })
  @ApiParam({ name: 'id', type: Number, description: 'Booking id' })
  @ApiBody({ type: UpdateBookingDto })
  @ApiResponse({ status: 200, description: 'Booking updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.updateBooking(id, dto);
  }
}
