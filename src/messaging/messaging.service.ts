import {Injectable, OnModuleInit} from '@nestjs/common';
import {Client, LocalAuth, Message, MessageMedia} from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import {PinoLogger} from 'nestjs-pino';
import * as process from 'process';
import {maskString, normalizePhone} from '../utils';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {OcrService} from '../ocr/ocr.service';

@Injectable()
export class MessagingService implements OnModuleInit {

    private client: Client;

    constructor(private readonly log: PinoLogger, private readonly eventEmitter: EventEmitter2, private readonly ocrService: OcrService) {
        this.log.setContext(MessagingService.name);
    }

    async onModuleInit(): Promise<any> {
        const additionalOptions = process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {};
        this.log.info('Chrome Path %s', process.env.CHROME_BIN);
        this.client = new Client(
            {
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                    ...additionalOptions
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

        await this.client.initialize();


        this.client.on('loading_screen', (percent: any, message: any) => {
            this.log.info('LOADING_SCREEN: %s %s', percent, message);
        })

        this.client.on('message', (message: Message) => {
            this.log.info(`Message from ${message.from}`);
            this.eventEmitter.emit('message.incoming', message);
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


    @OnEvent('message.incoming', {async: true})
    async replyImageToText(message: Message) {
        this.log.info(`Start Processing Image to Text from: ${message.from}`);
        let result;
        try {
            if (!message.hasMedia) {
                await message.reply('Please send an image to start OCR processing');
                return;
            }
            result = await this.ocrService.extractText(message);
            await message.reply(result);
        } catch (err) {
            this.log.error(err, `Error Processing Image to Text from: ${message.from} ${err.message}`);
            await message.reply(`Oops, something went wrong. Please Try again later!\n${err.message}`);
            return;
        }
        this.log.info(`Successfully Processed Image to Text from: ${message.from} result: ${result}`);

    }
}
