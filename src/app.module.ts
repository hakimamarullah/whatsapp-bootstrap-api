import {Module} from '@nestjs/common';
import {MessagingModule} from './messaging/messaging.module';
import {LoggerModule} from 'nestjs-pino';
import {EventEmitterModule} from '@nestjs/event-emitter';
import {OcrService} from './ocr/ocr.service';
import {ConfigModule} from '@nestjs/config';
import { OcrModule } from './ocr/ocr.module';

@Module({
    imports: [
        EventEmitterModule.forRoot({global: true}),
        ConfigModule.forRoot({ isGlobal: true, cache: true }),
        LoggerModule.forRoot({
            pinoHttp: {
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                colorize: true,
                                singleLine: true,
                            },
                        }
                        : undefined,
            },
        }),
        MessagingModule,
        OcrModule],
    providers: [OcrService]
})
export class AppModule {
}
