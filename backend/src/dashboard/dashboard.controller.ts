import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RefreshableDateRangeQueryDto } from '../infloww/dto/infloww-query.dto';
import { DashboardService } from './dashboard.service';
import { DashboardRevenueQueryDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Get main agency KPIs (Total Revenue, Total Creators, Total Fans, Active Chatters, Avg Revenue per Creator, Total Transactions)',
  })
  async getOverview(@Query() query: RefreshableDateRangeQueryDto) {
    return this.dashboardService.getOverview(query);
  }

  @Get('revenue')
  @ApiOperation({
    summary:
      'Get time-series revenue, category distribution, and creator earnings breakdown for dashboard charts',
  })
  async getRevenue(@Query() query: DashboardRevenueQueryDto) {
    return this.dashboardService.getRevenue(query);
  }

  @Get('performance')
  @ApiOperation({
    summary:
      'Get top creators, top chatters, and top marketing tracking links performance summary',
  })
  async getPerformance(@Query() query: RefreshableDateRangeQueryDto) {
    return this.dashboardService.getPerformance(query);
  }
}
