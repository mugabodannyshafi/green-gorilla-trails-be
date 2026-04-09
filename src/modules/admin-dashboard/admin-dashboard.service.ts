import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/14_booking.entity';
import { Package, PackageStatus } from '../../database/entities/2_package.entity';
import { PackageService } from '../package/package.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import {
  BookingsOverTimePointDto,
  DashboardTrendsDto,
  RevenueByPackageDto,
} from './dto/dashboard-trends.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly packageService: PackageService,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const confirmedStatuses = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

    const [totalBookings, totalRevenueRaw, packageStats] = await Promise.all([
      this.entityManager.count(Booking, {
        where: { status: In(confirmedStatuses) },
      }),
      this.entityManager
        .createQueryBuilder(Booking, 'b')
        .innerJoin(Package, 'p', 'p.id = b.package_id')
        .where('b.status IN (:...statuses)', { statuses: confirmedStatuses })
        .select('COALESCE(SUM(p.base_price * b.number_of_guests), 0)', 'totalRevenue')
        .getRawOne<{ totalRevenue: string | null }>(),
      this.packageService.getPackageStatistics(),
    ]);

    const totalRevenue = totalRevenueRaw?.totalRevenue ? Number(totalRevenueRaw.totalRevenue) : 0;

    const dto = new DashboardSummaryDto();
    dto.totalBookings = totalBookings;
    dto.totalRevenue = totalRevenue;
    dto.activePackages = packageStats.published;

    return dto;
  }

  async getTrends(): Promise<DashboardTrendsDto> {
    const confirmedStatuses = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

    const bookingsOverTimeRaw = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .where('b.status IN (:...statuses)', { statuses: confirmedStatuses })
      .select("DATE_FORMAT(FROM_UNIXTIME(b.travel_date), '%Y-%m-%d')", 'date')
      .addSelect('COUNT(*)', 'bookings')
      .groupBy("DATE_FORMAT(FROM_UNIXTIME(b.travel_date), '%Y-%m-%d')")
      .orderBy("DATE_FORMAT(FROM_UNIXTIME(b.travel_date), '%Y-%m-%d')", 'ASC')
      .getRawMany<{ date: string; bookings: string }>();

    const bookingsOverTime: BookingsOverTimePointDto[] = bookingsOverTimeRaw.map((row) => {
      const point = new BookingsOverTimePointDto();
      point.date = row.date;
      point.bookings = Number(row.bookings) || 0;
      return point;
    });

    const revenueByPackageRaw = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .innerJoin(Package, 'p', 'p.id = b.package_id')
      .where('b.status IN (:...statuses)', { statuses: confirmedStatuses })
      .andWhere('p.status = :packageStatus', { packageStatus: PackageStatus.PUBLISHED })
      .select('p.title', 'packageName')
      .addSelect('COALESCE(SUM(p.base_price * b.number_of_guests), 0)', 'revenue')
      .groupBy('p.id')
      .addGroupBy('p.title')
      .orderBy('revenue', 'DESC')
      .getRawMany<{ packageName: string; revenue: string }>();

    const revenueByPackage: RevenueByPackageDto[] = revenueByPackageRaw.map((row) => {
      const item = new RevenueByPackageDto();
      item.packageName = row.packageName;
      item.revenue = Number(row.revenue) || 0;
      return item;
    });

    const dto = new DashboardTrendsDto();
    dto.bookingsOverTime = bookingsOverTime;
    dto.revenueByPackage = revenueByPackage;

    return dto;
  }
}
