import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { InflowwClient } from './infloww.client';
import { InflowwService } from './infloww.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [InflowwClient, InflowwService],
  exports: [InflowwClient, InflowwService],
})
export class InflowwModule {}
