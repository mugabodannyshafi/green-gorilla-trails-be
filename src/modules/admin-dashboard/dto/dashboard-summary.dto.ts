import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ example: 128, description: 'Total number of confirmed/completed bookings' })
  totalBookings: number;

  @ApiProperty({ example: 48250, description: 'Total revenue from confirmed/completed bookings' })
  totalRevenue: number;

  @ApiProperty({ example: 14, description: 'Number of currently active/published packages' })
  activePackages: number;
}

