import { Injectable } from '@nestjs/common';
import { createLogger } from '@taskscore/utils';
import {
  GetUserByIdRequestDto,
  ListUsersRequestDto,
  UserListResponseDto,
  UserRequestsRPCMessage,
  UserResponseDto,
} from '@taskscore/types';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { GatewayEnv } from '../../config/envLoader.config';

@Injectable()
export class UserService {
  private readonly logger = createLogger({
    service: 'user-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  private readonly usersQueue: string;

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly configService: ConfigService<GatewayEnv, true>,
  ) {
    const queue = this.configService.get('rabbitmq.queues.users', { infer: true });
    if (!queue) {
      this.logger.error('Users queue is not configured');
      throw new Error('Users queue is not configured');
    }
    this.usersQueue = queue;
  }

  async getMe(userId: string, traceId: string): Promise<UserResponseDto> {
    this.logger.debug('Forwarding get me request to user service', {
      traceId,
      userId,
    });

    const payload: GetUserByIdRequestDto = {
      userId,
    };

    try {
      return await this.rabbitMQService.sendToQueue<GetUserByIdRequestDto, UserResponseDto>(
        this.usersQueue,
        UserRequestsRPCMessage.GetUserById,
        payload,
        traceId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward get me request', {
        traceId,
        userId,
        error: errorMessage,
      });
      throw error;
    }
  }

  async listUsers(filters: ListUsersRequestDto, traceId: string): Promise<UserListResponseDto> {
    this.logger.debug('Forwarding list users request to user service', {
      traceId,
      page: filters.page,
      limit: filters.limit,
      userName: filters.userName,
    });

    try {
      return await this.rabbitMQService.sendToQueue<ListUsersRequestDto, UserListResponseDto>(
        this.usersQueue,
        UserRequestsRPCMessage.ListUsers,
        filters,
        traceId,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward list users request', {
        traceId,
        page: filters.page,
        limit: filters.limit,
        userName: filters.userName,
        error: errorMessage,
      });
      throw error;
    }
  }
}
