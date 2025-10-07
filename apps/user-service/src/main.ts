import { NestFactory } from '@nestjs/core';
import { Transport, RmqOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { createLogger } from '@taskscore/utils';
import { userConfig } from './config/envLoader';

async function bootstrap() {
  const logger = createLogger({
    service: 'user-service-main',
    environment: process.env.NODE_ENV ?? 'development',
  });

  try {
    logger.info('Starting user service (RabbitMQ microservice)');
    const config = userConfig();

    const rabbitMqOptions: RmqOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [config.rabbitmq.url],
        queue: config.rabbitmq.queue,
        queueOptions: {
          durable: config.rabbitmq.queueDurable,
        },
      },
    };

    const app = await NestFactory.createMicroservice<RmqOptions>(AppModule, rabbitMqOptions);
    await app.listen();

    logger.info('User microservice is listening for RabbitMQ messages', {
      queue: config.rabbitmq.queue,
      url: config.rabbitmq.url,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to start user service', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

bootstrap();