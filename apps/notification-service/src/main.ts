import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  // Criar aplicação HTTP + WebSocket
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilitar CORS para WebSocket
  const corsOrigin = configService.get<string>('WS_CORS_ORIGIN', 'http://localhost:8080');
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  // Conectar ao RabbitMQ como microserviço
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
  const queueName = configService.get<string>('RABBITMQ_QUEUE_NOTIFICATIONS', 'notifications.queue');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: queueName,
      queueOptions: {
        durable: false,        // Não persiste mensagens (eventos efêmeros)
      },
      prefetchCount: 10,
      noAck: true,             // Auto-acknowledge (não reprocessa)
    },
  });

  // Iniciar todos os serviços
  await app.startAllMicroservices();
  logger.log('✅ RabbitMQ microservice started');

  const port = configService.get<number>('PORT', 3003);
  await app.listen(port);

  logger.log(`🚀 Notification Service running on port ${port}`);
  logger.log(`🔌 WebSocket server ready`);
}

bootstrap();

