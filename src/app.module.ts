import {Module} from '@nestjs/common';
import {MessagingModule} from './messaging/messaging.module';
import {LoggerModule} from 'nestjs-pino';

@Module({
    imports: [
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
        MessagingModule]
})
export class AppModule {
}
