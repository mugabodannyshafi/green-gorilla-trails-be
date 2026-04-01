import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@rwanda360/rwanda360-service-sdk';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardTrendsDto } from './dto/dashboard-trends.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class AdminDashboardController extends BaseController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {
    super();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get admin dashboard summary' })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  async getSummary(): Promise<DashboardSummaryDto> {
    return this.adminDashboardService.getSummary();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get admin dashboard trends' })
  @ApiResponse({ status: 200, type: DashboardTrendsDto })
  async getTrends(): Promise<DashboardTrendsDto> {
    return this.adminDashboardService.getTrends();
  }
}

