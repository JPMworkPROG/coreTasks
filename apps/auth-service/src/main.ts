import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { createLogger } from '@taskscore/utils';
import { AuthEnv } from '../config/envLoader';

async function bootstrap() {
  const logger = createLogger({
    service: 'auth-service-main',
    environment: process.env.NODE_ENV ?? 'development',
  });

  try {
    logger.info('Starting auth service...');

    // Criar aplicação NestJS
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService<AuthEnv, true>);

    // Configurar validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configurar CORS se necessário
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Configurar microserviço RabbitMQ
    const rabbitmqUrl = configService.get('rabbitmq.url', { infer: true });
    const rabbitmqQueue = configService.get('rabbitmq.queue', { infer: true });
    const rabbitmqQueueDurable = configService.get('rabbitmq.queueDurable', { infer: true });

    logger.info('Connecting to RabbitMQ', {
      url: rabbitmqUrl,
      queue: rabbitmqQueue,
      durable: rabbitmqQueueDurable,
    });

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: rabbitmqQueue,
        queueOptions: {
          durable: rabbitmqQueueDurable,
        },
        socketOptions: {
          heartbeatIntervalInSeconds: 60,
          reconnectTimeInSeconds: 5,
        },
        prefetchCount: 1, // Processar uma mensagem por vez
      },
    });

    // Inicializar microserviços
    await app.startAllMicroservices();

    // Iniciar servidor HTTP (opcional, para health checks)
    const port = configService.get('server.port', { infer: true });
    await app.listen(port);

    logger.info('Auth service started successfully', {
      port,
      rabbitmqUrl,
      rabbitmqQueue,
      environment: process.env.NODE_ENV ?? 'development',
    });

    // Configurar graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { 
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString()
      });
      process.exit(1);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start auth service', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

bootstrap();
