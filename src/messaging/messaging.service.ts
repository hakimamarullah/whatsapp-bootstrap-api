import {Injectable, OnModuleInit} from '@nestjs/common';
import {Client, LocalAuth} from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import {PinoLogger} from 'nestjs-pino';

@Injectable()
export class MessagingService implements OnModuleInit {

    private client: Client;

    constructor(private readonly log: PinoLogger) {
        this.log.setContext(MessagingService.name);
    }

    onModuleInit(): any {
        this.client = new Client(
            {
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox']
                },
                authStrategy: new LocalAuth()
            }
        )

        this.client.on('qr', (qr: any) => {
            this.log.info('QR RECEIVED');
            qrcode.generate(qr, {small: true});
        })

        this.client.on('ready', () => {
            this.log.info('Whatsapp Client is ready!');
        })

        this.client.initialize();

        this.client.on('loading_screen', (percent: any, message: any) => {
            this.log.info({ event: 'loading_screen', percent, message }, 'LOADING SCREEN');
        });


    }

    async sendMessage(to: string, message: string) {
        await this.client.sendMessage(to, message);
    }
}
