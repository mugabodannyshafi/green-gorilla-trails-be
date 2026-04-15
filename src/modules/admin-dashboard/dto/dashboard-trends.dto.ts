import { ApiProperty } from '@nestjs/swagger';

export class BookingsOverTimePointDto {
  @ApiProperty({ example: '2025-11-01', description: 'Date bucket in ISO YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 4, description: 'Number of bookings on the given date' })
  bookings: number;
}

export class RevenueByPackageDto {
  @ApiProperty({ example: 'Serengeti Explorer', description: 'Package title/name' })
  packageName: string;

  @ApiProperty({ example: 18500, description: 'Total revenue attributed to this package' })
  revenue: number;
}

export class BookingStatusCountDto {
  @ApiProperty({ example: 'PENDING', description: 'Booking status value' })
  status: string;

  @ApiProperty({ example: 12, description: 'Number of bookings in this status' })
  count: number;
}

export class PackageStatusCountDto {
  @ApiProperty({ example: 'Published', description: 'Human-readable package status label' })
  label: string;

  @ApiProperty({ example: 5, description: 'Number of packages in this status' })
  count: number;
}

export class DashboardTrendsDto {
  @ApiProperty({ type: [BookingsOverTimePointDto] })
  bookingsOverTime: BookingsOverTimePointDto[];

  @ApiProperty({ type: [RevenueByPackageDto] })
  revenueByPackage: RevenueByPackageDto[];

  @ApiProperty({
    type: [BookingStatusCountDto],
    description: 'All bookings grouped by status (for dashboard pie charts)',
  })
  bookingsByStatus: BookingStatusCountDto[];

  @ApiProperty({
    type: [PackageStatusCountDto],
    description: 'Package counts by lifecycle status (draft / published / archived)',
  })
  packagesByStatus: PackageStatusCountDto[];
}
