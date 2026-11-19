import { Module } from '@nestjs/common';
import { ChattersModule } from '../chatters/chatters.module';
import { CreatorsModule } from '../creators/creators.module';
import { EarningsModule } from '../earnings/earnings.module';
import { TrackingLinksModule } from '../tracking-links/tracking-links.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    CreatorsModule,
    ChattersModule,
    EarningsModule,
    TrackingLinksModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
