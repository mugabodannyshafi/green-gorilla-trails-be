import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/14_booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EmailService } from '../email/email.service';
import { BaseService, PaginationData, PaginationResponse } from '@rwanda360/rwanda360-service-sdk';

@Injectable()
export class BookingsService extends BaseService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async create(packageId: number, dto: CreateBookingDto): Promise<Booking> {
    const travelDate = this.toTravelDateInt(dto.prefferedDate);

    const booking = this.bookingRepository.create({
      package_id: packageId,
      travel_date: travelDate,
      customer_name: dto.names,
      email: dto.email,
      number_of_guests: 1,
      number_of_days: dto.numberOfDays,
      message: dto.message,
      status: BookingStatus.PENDING,
    });

    const saved = await this.bookingRepository.save(booking);

    await this.emailService.sendBookingNotificationEmail(saved);

    return saved;
  }

  async getAllBookings(
    pagination: PaginationData,
    status?: BookingStatus,
    packageId?: number,
    email?: string,
  ): Promise<PaginationResponse> {
    const where: FindOptionsWhere<Booking> = {};

    if (status && String(status).trim() !== '') {
      const statusFilter = String(status).toUpperCase() as BookingStatus;
      if (!Object.values(BookingStatus).includes(statusFilter)) {
        throw new Error('Invalid booking status');
      }
      where.status = statusFilter;
    }

    if (packageId) {
      where.package_id = packageId;
    }

    if (email && String(email).trim() !== '') {
      where.email = String(email).trim();
    }

    const [items, total] = await this.bookingRepository.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: pagination.skip,
      take: pagination.take,
    });

    return this.paginate(items, total, pagination);
  }

  private toTravelDateInt(dateStr: string): number {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid preferred date');
    }

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    return year * 10000 + month * 100 + day;
  }
}
