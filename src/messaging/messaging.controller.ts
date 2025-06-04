import {Body, Controller, Post} from '@nestjs/common';
import {MessagingService} from './messaging.service';

@Controller('wa')
export class MessagingController {
    constructor(private readonly whatsappService: MessagingService) {}

    @Post('send')
    async sendMessage(
        @Body() body: { to: string; message: string },
    ): Promise<{ status: string }> {
        const phoneWithSuffix = body.to.includes('@c.us') ? body.to : `${body.to}@c.us`;
        await this.whatsappService.sendMessage(phoneWithSuffix, body.message);
        return { status: 'Message sent' };
    }
}
