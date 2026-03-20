import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { MotilisController } from './motilis.controller';
import { Motilis, MotilisSchema } from './motilis.schema';
import { MotilisService } from './motilis.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Motilis.name, schema: MotilisSchema }]),
  ],
  controllers: [MotilisController],
  providers: [MotilisService],
})
export class MotilisModule { }
