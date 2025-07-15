import {Injectable, OnModuleInit} from '@nestjs/common';
import {Client, Message, MessageMedia, RemoteAuth, LocalAuth} from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import {PinoLogger} from 'nestjs-pino';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {OcrService} from '../ocr/ocr.service';
import {MongoStore} from 'wwebjs-mongo';
import mongoose from 'mongoose';
import * as process from 'process';
import {maskString, normalizePhone} from '../utils';

@Injectable()
export class MessagingService implements OnModuleInit {
    private client: Client;

    constructor(
        private readonly log: PinoLogger,
        private readonly eventEmitter: EventEmitter2,
        private readonly ocrService: OcrService,
    ) {
        this.log.setContext(MessagingService.name);
    }

    async onModuleInit(): Promise<void> {
        const mongoUri = process.env.MONGO_URI;
        const additionalOptions = process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {};
        const puppeteerOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            ...additionalOptions,
        };

        let authStrategy: RemoteAuth | LocalAuth;

        if (mongoUri) {
            this.log.info('MONGO_URI found, using RemoteAuth via wwebjs-mongo');
            try {
                await this.connectWithRetry(mongoUri);
                const store = new MongoStore({mongoose});

                authStrategy = new RemoteAuth({
                    clientId: process.env.WA_CLIENT_ID ?? 'starline-client',
                    store,
                    backupSyncIntervalMs: parseInt(process.env.WA_BACKUP_SYNC_INTERVAL ?? '300000'), // 5 minutes
                });
            } catch (err) {
                this.log.error(err, 'Failed to connect to MongoDB, falling back to LocalAuth');
                authStrategy = new LocalAuth();
            }
        } else {
            this.log.warn('MONGO_URI not found, falling back to LocalAuth');
            authStrategy = new LocalAuth();
        }

        this.log.info(`Using AuthStrategy: ${authStrategy.constructor.name}`);

        this.client = new Client({
            puppeteer: puppeteerOptions,
            authStrategy,
        });

        this.client.on('qr', (qr: string) => {
            this.log.info('QR RECEIVED');
            qrcode.generate(qr, {small: true});
        });

        this.client.on('remote_session_saved', () => {
            this.log.info('REMOTE_SESSION_SAVED: %s', authStrategy.clientId)
        });

        this.client.on('authenticated', (clientSession) => {
            this.log.info('AUTHENTICATED: %s', clientSession?.WABrowserId);
        })

        this.client.on('auth_failure', (message) => {
            this.log.info('AUTHENTICATION FAILED %s', message);
        });

        this.client.on('disconnected', (reason) => {
            this.log.info('DISCONNECTED: %s', reason);
        });

        this.client.on('ready', () => {
            this.log.info('WhatsApp Client is ready!');
        });

        this.client.on('loading_screen', (percent: number, message: string) => {
            this.log.info('LOADING_SCREEN: %s %s', percent, message);
        });

        this.client.on('message', (message: Message) => {
            let enableMessageListener = (process.env.ENABLE_MESSAGE_LISTENER ?? 'false') === 'true'
            if (enableMessageListener) {
                this.log.info('Message received from %s: %s', message.from, message.body);
                this.eventEmitter.emit('message.incoming', message);
            }
        });

        await this.client.initialize();
    }

    async sendMessage(to: string, message?: string, files?: Array<Express.Multer.File>): Promise<void> {
        this.log.info('Sending message to %s', maskString(to, 7));
        const chatId = normalizePhone(to);

        if (files?.length) {
            this.log.info('Sending %s files', files.length);
            for (const file of files) {
                const media = new MessageMedia(
                    file.mimetype,
                    file.buffer.toString('base64'),
                    file.originalname,
                );
                const response: Message = await this.client.sendMessage(chatId, media);
                this.log.info('Media sent with id: %s', response.id.id);
            }
        }

        if (message) {
            const response = await this.client.sendMessage(chatId, message);
            this.log.info('Message sent with id: %s', response.id.id);
        }

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
            this.log.error(err, `Error Processing Image to Text from: ${message.from}`);
            await message.reply(`Oops, something went wrong. Please try again later!\n${err.message}`);
        }

        this.log.info(`Successfully Processed Image to Text from: ${message.from} result: ${result}`);
    }

    private async connectWithRetry(uri: string): Promise<void> {
        const maxAttempts = parseInt(process.env.MONGO_MAX_ATTEMPTS ?? '20');
        const delayMs = parseInt(process.env.MONGO_RETRY_DELAY ?? '10000');

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await mongoose.connect(uri);
                this.log.info('✅ Connected to MongoDB');
                return;
            } catch (err) {
                this.log.warn(`❌ MongoDB connection attempt ${attempt} failed: ${err.message}`);
                if (attempt === maxAttempts) {
                    throw new Error('❌ MongoDB connection failed after multiple attempts');
                }
                await new Promise((res) => setTimeout(res, delayMs));
            }
        }
    }

}
