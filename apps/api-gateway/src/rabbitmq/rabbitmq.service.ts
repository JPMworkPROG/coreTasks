import { Injectable, OnModuleInit, HttpException, OnApplicationShutdown } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { createLogger, sendRpc, type RpcSendOptions } from '@taskscore/utils';
import { ConfigService } from '@nestjs/config';
import { GatewayEnv } from '../config/envLoader.config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnApplicationShutdown {
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
  private readonly inFlightClients = new Map<string, Promise<ClientProxy>>();

  constructor(private readonly configService: ConfigService<GatewayEnv, true>) {
    const requestTimeoutMs =
      this.configService.get('rabbitmq.requestTimeoutMs', { infer: true }) ?? 5000;

    this.rpcOptions = {
      timeoutMs: requestTimeoutMs,
      logger: this.logger,
      errorMessage: 'RabbitMQ RPC request failed',
      timeoutMessage: 'RabbitMQ RPC request timed out',
    };
    const url = this.configService.get('rabbitmq.url', { infer: true });
    if (!url || typeof url !== 'string' || url.length === 0) {
      throw new Error('Missing config: rabbitmq.url');
    }
    const durable = this.configService.get('rabbitmq.queueDurable', { infer: true });
    this.baseClientOptions = {
      urls: [url],
      queueOptions: {
        durable: Boolean(durable),
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

    try {
      await Promise.all(
        queues.map(async (queue) => {
          this.logger.info('Preconnecting RabbitMQ client', { queue });
          await this.getClient(queue);
        }),
      );
    } catch (error: any) {
      this.logger.error('Failed to initialize RabbitMQ connections', { error: error.message, queues });
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    for (const [queue, client] of this.clients.entries()) {
      try {
        this.logger.info('Closing RabbitMQ client connection...', { queue });
        await client.close();
        this.logger.info('RabbitMQ client disconnected successfully', { queue });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Error closing RabbitMQ client', { queue, error: errorMessage });
      } finally {
        this.clients.delete(queue);
        this.inFlightClients.delete(queue);
      }
    }
  }

  private async getClient(queue: string): Promise<ClientProxy> {
    const existingClient = this.clients.get(queue);
    if (existingClient) {
      return existingClient;
    }

    const inFlight = this.inFlightClients.get(queue);
    if (inFlight) {
      return inFlight;
    }

    this.logger.info(`Creating RabbitMQ client for queue ${queue}`, { queue });

    const promise = this.connectWithRetry(queue);
    this.inFlightClients.set(queue, promise);
    return promise;
  }

  private async connectWithRetry(queue: string, maxRetries: number = 5): Promise<ClientProxy> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            ...this.baseClientOptions,
            queue,
          },
        });

        await client.connect();
        
        this.logger.info('RabbitMQ client connected successfully', { queue, attempt });
        this.clients.set(queue, client);
        this.inFlightClients.delete(queue);
        return client;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`RabbitMQ connection attempt ${attempt}/${maxRetries} failed`, { 
          queue, 
          attempt, 
          error: lastError.message 
        });
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.inFlightClients.delete(queue);
    this.logger.error('RabbitMQ client connection failed after all retries', { 
      queue, 
      maxRetries, 
      error: lastError?.message 
    });
    throw lastError;
  }

  async sendToQueue<TPayload, TResponse>(
    queue: string,
    pattern: string,
    payload: TPayload,
    traceId: string,
    options?: { timeoutMs?: number },
  ): Promise<TResponse> {
    this.logger.info(`Sending message to queue ${queue} with pattern ${pattern}`, {
      traceId,
      pattern,
      queue
    });

    try {
      const message = {
        payload,
        traceId
      };

      const client = await this.getClient(queue);

      const response = await sendRpc<typeof message, TResponse>(
        client,
        pattern,
        message,
        {
          ...this.rpcOptions,
          traceId,
          ...(options?.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
        },
      );

      this.logger.info(`Message sent successfully to queue ${queue} with pattern ${pattern}`, {
        traceId,
        pattern,
        queue
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send message to queue ${queue} with pattern ${pattern}`, {
        traceId,
        pattern,
        queue,
        error: errorMessage
      });

      const statusCodeRaw = (error as any)?.error?.status ?? (error as any)?.status;
      const statusCode = typeof statusCodeRaw === 'number' ? statusCodeRaw : Number(statusCodeRaw);
      const problem = (error as any)?.error;
      const safeBody = problem && typeof problem === 'object'
        ? (({ status, title, detail, type, instance }) => ({ status, title, detail, type, instance }))(problem)
        : { status: statusCode, title: 'Upstream error' };

      if (Number.isFinite(statusCode) && statusCode >= 400 && statusCode < 600) {
        throw new HttpException(safeBody, statusCode);
      }

      throw error;
    }
  }
}