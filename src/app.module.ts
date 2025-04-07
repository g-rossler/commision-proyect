import { Module } from '@nestjs/common';

import { DealModule } from './deal/deal.module';

@Module({
  imports: [DealModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
