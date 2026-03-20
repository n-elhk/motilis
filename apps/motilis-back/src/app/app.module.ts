import { Module } from '@nestjs/common';
import { MotilisModule } from './features/motilis/motilis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_HOST),
    MotilisModule,
  ],
})
export class AppModule {}
