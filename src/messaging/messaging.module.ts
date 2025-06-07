import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import {OcrModule} from '../ocr/ocr.module';
import {OcrService} from '../ocr/ocr.service';

@Module({
  imports: [OcrModule],
  providers: [MessagingService, OcrService],
  controllers: [MessagingController]
})
export class MessagingModule {}
