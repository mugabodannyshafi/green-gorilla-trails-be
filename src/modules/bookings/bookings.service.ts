import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/14_booking.entity';
import { Package } from '../../database/entities/2_package.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { EmailService } from '../email/email.service';
import { BaseService, PaginationData, PaginationResponse } from '@rwanda360/rwanda360-service-sdk';

@Injectable()
export class BookingsService extends BaseService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async create(packageId: number, dto: CreateBookingDto): Promise<Booking> {
    const pkg = await this.entityManager.findOne(Package, { where: { id: packageId } });
    if (!pkg) {
      throw new BadRequestException('Package not found');
    }

    const travelDate = this.toTravelDateInt(dto.prefferedDate);

    const booking = this.entityManager.create(Booking, {
      package_id: packageId,
      travel_date: travelDate,
      customer_name: dto.names,
      email: dto.email,
      number_of_guests: 1,
      number_of_days: dto.numberOfDays,
      message: dto.message,
      status: BookingStatus.PENDING,
    });

    const saved = await this.entityManager.save(Booking, booking);

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
        throw new BadRequestException('Invalid booking status');
      }
      where.status = statusFilter;
    }

    if (packageId) {
      where.package_id = packageId;
    }

    if (email && String(email).trim() !== '') {
      where.email = String(email).trim();
    }

    const [bookings, total] = await this.entityManager.findAndCount(Booking, {
      where,
      relations: { package: true },
      order: { id: 'DESC' },
      skip: pagination.skip,
      take: pagination.take,
    });

    const items = bookings.map((b) => this.serializeBookingListItem(b));
    return this.paginate(items, total, pagination);
  }

  async getBookingById(id: number): Promise<Booking> {
    const booking = await this.entityManager.findOne(Booking, {
      where: { id },
      relations: { package: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async updateBooking(id: number, dto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.entityManager.findOne(Booking, {
      where: { id },
      relations: { package: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (dto.status !== undefined) {
      booking.status = dto.status;
    }
    if (dto.special_requests !== undefined) {
      booking.special_requests = dto.special_requests;
    }
    if (dto.message !== undefined) {
      booking.message = dto.message;
    }
    if (dto.number_of_guests !== undefined) {
      booking.number_of_guests = dto.number_of_guests;
    }

    const saved = await this.entityManager.save(Booking, booking);

    await this.emailService.sendBookingCustomerUpdateEmail(saved);

    return saved;
  }

  /**
   * travel_date is stored as YYYYMMDD (see toTravelDateInt), not Unix seconds.
   */
  private formatTravelDateYyyymmdd(n: number): string {
    const v = Math.floor(Number(n));
    if (!Number.isFinite(v) || v < 10000101 || v > 99991231) {
      return String(n);
    }
    const year = Math.floor(v / 10000);
    const month = Math.floor((v % 10000) / 100);
    const day = v % 100;
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return String(n);
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private serializeBookingListItem(booking: Booking): Record<string, unknown> {
    return {
      id: Number(booking.id),
      package_id: Number(booking.package_id),
      package: booking.package
        ? {
            id: Number(booking.package.id),
            title: booking.package.title,
            slug: booking.package.slug,
          }
        : null,
      travel_date: this.formatTravelDateYyyymmdd(booking.travel_date),
      customer_name: booking.customer_name,
      email: booking.email,
      number_of_guests: booking.number_of_guests,
      number_of_days: booking.number_of_days,
      message: booking.message ?? null,
      special_requests: booking.special_requests ?? null,
      status: booking.status,
      created_at: DateTime.fromSeconds(booking.created_at).toFormat('yyyy-LL-dd, HH:mm'),
      updated_at:
        booking.updated_at != null
          ? DateTime.fromSeconds(booking.updated_at).toFormat('yyyy-LL-dd, HH:mm')
          : null,
    };
  }

  private toTravelDateInt(dateStr: string): number {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid preferred date');
    }

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    return year * 10000 + month * 100 + day;
  }
}
