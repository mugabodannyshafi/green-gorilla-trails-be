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

export class DashboardTrendsDto {
  @ApiProperty({ type: [BookingsOverTimePointDto] })
  bookingsOverTime: BookingsOverTimePointDto[];

  @ApiProperty({ type: [RevenueByPackageDto] })
  revenueByPackage: RevenueByPackageDto[];
}
