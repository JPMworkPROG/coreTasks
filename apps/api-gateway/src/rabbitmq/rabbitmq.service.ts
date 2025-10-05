import { Injectable, OnModuleDestroy, OnModuleInit, HttpException } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { createLogger, sendRpc, type RpcSendOptions } from '@taskscore/utils';
import { ConfigService } from '@nestjs/config';
import { GatewayEnv } from '../../config/envLoader';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = createLogger({
    service: 'api-gateway-rabbitmq',
    environment: process.env.NODE_ENV ?? 'development',
  });

  private readonly rpcOptions: RpcSendOptions;
  private readonly baseClientOptions: {
    urls: string[];
    queueOptions: { durable: boolean };
  };

  private readonly clients = new Map<string, ClientProxy>();

  constructor(private readonly configService: ConfigService<GatewayEnv, true>) {
    const requestTimeoutMs =
      this.configService.get('rabbitmq.requestTimeoutMs', { infer: true }) ?? 5000;

    this.rpcOptions = {
      timeoutMs: requestTimeoutMs,
      logger: this.logger,
      errorMessage: 'RabbitMQ RPC request failed',
      timeoutMessage: 'RabbitMQ RPC request timed out',
    };

    this.baseClientOptions = {
      urls: [this.configService.get('rabbitmq.url', { infer: true })],
      queueOptions: {
        durable: this.configService.get('rabbitmq.queueDurable', { infer: true }),
      },
    };
  }

  async onModuleInit(): Promise<void> {
    const queuesConfig = this.configService.get('rabbitmq.queues', { infer: true }) ?? {};
    const queues = Array.from(
      new Set(
        Object.values(queuesConfig).filter((queue): queue is string => typeof queue === 'string' && queue.length > 0),
      ),
    );

    for (const queue of queues) {
      this.logger.info('Preconnecting RabbitMQ client', { queue });
      await this.getClient(queue);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const [queue, client] of this.clients.entries()) {
      try {
        this.logger.info('Closing RabbitMQ client connection...', { queue });
        await client.close();
        this.logger.info('RabbitMQ client disconnected successfully', { queue });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Error closing RabbitMQ client', { queue, error: errorMessage });
      }
    }
  }

  private async getClient(queue: string): Promise<ClientProxy> {
    const existingClient = this.clients.get(queue);
    if (existingClient) {
      return existingClient;
    }

    this.logger.info('Creating RabbitMQ client for queue', { queue });

    const client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        ...this.baseClientOptions,
        queue,
      },
    });

    await client.connect();

    this.logger.info('RabbitMQ client connected successfully', { queue });

    this.clients.set(queue, client);

    return client;
  }

  /**
   * Envia uma requisição RPC para uma fila específica
   * @param queue Nome da fila de destino
   * @param pattern Padrão da mensagem RPC
   * @param payload Dados a serem enviados
   * @param correlationId ID de correlação para rastreamento
   * @returns Resposta do serviço de destino
   */
  async sendToQueue<TPayload, TResponse>(
    queue: string,
    pattern: string,
    payload: TPayload,
    correlationId: string,
  ): Promise<TResponse> {
    this.logger.info(`Sending RPC message to queue ${queue} with pattern ${pattern}`, { 
      correlationId, 
      pattern,
      queue
    });

    try {
      const message = {
        payload,
        correlationId,
      };

      const client = await this.getClient(queue);

      const response = await sendRpc<typeof message, TResponse>(
        client,
        pattern,
        message,
        {
          ...this.rpcOptions,
          correlationId,
        },
      );

      this.logger.info('RPC message sent successfully', {
        correlationId,
        pattern,
        queue
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to send RPC message', {
        correlationId,
        pattern,
        queue,
        error: errorMessage
      });

      // Map ProblemDetails (carregado pelo utils) para HttpException
      const status = (error as any)?.error?.status ?? (error as any)?.status;
      const response = (error as any)?.error ?? error;

      if (typeof status === 'number' && status >= 400 && status < 600) {
        throw new HttpException(response, status);
      }

      throw error;
    }
  }
}
