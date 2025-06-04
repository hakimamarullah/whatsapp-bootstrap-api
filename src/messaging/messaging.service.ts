import {Injectable, OnModuleInit} from '@nestjs/common';
import {Client, LocalAuth, Message, MessageMedia} from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import {PinoLogger} from 'nestjs-pino';
import * as process from 'process';
import {maskString, normalizePhone} from '../utils';

@Injectable()
export class MessagingService implements OnModuleInit {

    private client: Client;

    constructor(private readonly log: PinoLogger) {
        this.log.setContext(MessagingService.name);
    }

    async onModuleInit(): Promise<any> {
        const additionalOptions = process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {};
        this.log.info('Chrome Path %s', process.env.CHROME_BIN);
        this.client = new Client(
            {
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox'],
                    ...additionalOptions
                },
                authStrategy: new LocalAuth({dataPath: './.wwebjs_auth'})
            }
        )

        this.client.on('qr', (qr: any) => {
            this.log.info('QR RECEIVED');
            qrcode.generate(qr, {small: true});
        })

        this.client.on('ready', () => {
            this.log.info('Whatsapp Client is ready!');
        })

        await this.client.initialize();


        this.client.on('loading_screen', (percent: any, message: any) => {
            this.log.info('LOADING_SCREEN: %s %s', percent, message);
        })
    }

    async sendMessage(to: string, message?: string, files?: Array<Express.Multer.File>): Promise<void> {
        this.log.info('Sending message to %s', maskString(to, 7));
        const chatId = normalizePhone(to);
        if (files && files?.length > 0) {
            this.log.info('Sending %s files', files?.length);
            for (const file of files) {
                const media = new MessageMedia(
                    file.mimetype,
                    file.buffer.toString('base64'),
                    file.originalname,
                );

                const response : Message =   await this.client.sendMessage(chatId, media);
                this.log.info('Message sent with id: %s', response.id.id);

            }
        }
        await this.client.sendMessage(chatId, message || '');
        this.log.info('Successfully sent message to %s', maskString(to, 7));
    }
}
