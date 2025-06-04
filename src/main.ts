import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {Logger} from 'nestjs-pino';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger))
  const config = new DocumentBuilder()
      .setTitle('WhatsApp API')
      .setDescription('The WhatsApp API built on top of WWebJS library')
      .setVersion('v1.0.0')
      .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
