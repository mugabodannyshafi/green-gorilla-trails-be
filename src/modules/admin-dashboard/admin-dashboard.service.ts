import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Booking, BookingStatus } from '../../database/entities/14_booking.entity';
import { Package, PackageStatus } from '../../database/entities/2_package.entity';
import { PackageService } from '../package/package.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import {
  BookingStatusCountDto,
  BookingsOverTimePointDto,
  DashboardTrendsDto,
  PackageStatusCountDto,
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

    // travel_date is YYYYMMDD int (see bookings create), not Unix seconds
    const travelDateExpr =
      "DATE_FORMAT(STR_TO_DATE(LPAD(CAST(b.travel_date AS CHAR), 8, '0'), '%Y%m%d'), '%Y-%m-%d')";

    const bookingsOverTimeRaw = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .where('b.status IN (:...statuses)', { statuses: confirmedStatuses })
      .select(travelDateExpr, 'date')
      .addSelect('COUNT(*)', 'bookings')
      .groupBy(travelDateExpr)
      .orderBy(travelDateExpr, 'ASC')
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

    const bookingsByStatusRaw = await this.entityManager
      .createQueryBuilder(Booking, 'b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.status')
      .getRawMany<{ status: string; count: string }>();

    const bookingsByStatus: BookingStatusCountDto[] = bookingsByStatusRaw.map((row) => {
      const item = new BookingStatusCountDto();
      item.status = row.status;
      item.count = Number(row.count) || 0;
      return item;
    });

    const packageStats = await this.packageService.getPackageStatistics();
    const draftRow = new PackageStatusCountDto();
    draftRow.label = 'Draft';
    draftRow.count = packageStats.draft;
    const publishedRow = new PackageStatusCountDto();
    publishedRow.label = 'Published';
    publishedRow.count = packageStats.published;
    const archivedRow = new PackageStatusCountDto();
    archivedRow.label = 'Archived';
    archivedRow.count = packageStats.archived;
    const packagesByStatus = [draftRow, publishedRow, archivedRow];

    const dto = new DashboardTrendsDto();
    dto.bookingsOverTime = bookingsOverTime;
    dto.revenueByPackage = revenueByPackage;
    dto.bookingsByStatus = bookingsByStatus;
    dto.packagesByStatus = packagesByStatus;

    return dto;
  }
}
