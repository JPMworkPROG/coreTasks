import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { createLogger } from '@taskscore/utils';
import { TaskEnv } from './config/envLoader';

async function bootstrap() {
  const logger = createLogger({
    service: 'task-service-main',
    environment: process.env.NODE_ENV ?? 'development',
  });

  try {
    logger.info('Starting task service (RMQ microservice)');
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService<TaskEnv, true>);

    app.enableShutdownHooks();
    await app.startAllMicroservices();

    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

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
        prefetchCount: 1,
      },
    });

    await app.startAllMicroservices();

    const port = configService.get('server.port', { infer: true });
    await app.listen(port);

    logger.info('Task service started successfully', {
      port,
      rabbitmqUrl,
      rabbitmqQueue,
      environment: process.env.NODE_ENV ?? 'development',
    });

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

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise.toString(),
      });
      process.exit(1);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start task service', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

bootstrap();
