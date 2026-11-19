import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChattersModule } from './chatters/chatters.module';
import configuration from './config/configuration';
import { CreatorsModule } from './creators/creators.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EarningsModule } from './earnings/earnings.module';
import { InflowwModule } from './infloww/infloww.module';
import { TrackingLinksModule } from './tracking-links/tracking-links.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
    InflowwModule,
    DashboardModule,
    CreatorsModule,
    ChattersModule,
    EarningsModule,
    TrackingLinksModule,
  ],
})
export class AppModule {}
