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

  private readonly usersQueue = this.configService.get('rabbitmq.queues.users', { infer: true });

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly configService: ConfigService<GatewayEnv, true>,
  ) { }

  async getMe(userId: string, traceId: string): Promise<UserResponseDto> {
    this.logger.info('Forwarding get me request', { traceId, userId });
    const payload: GetUserByIdRequestDto = { userId };
    try {
      const result = await this.rabbitMQService.sendToQueue<GetUserByIdRequestDto, UserResponseDto>(
        this.usersQueue,
        UserRequestsRPCMessage.GetUserById,
        payload,
        traceId,
      );
      this.logger.info('Get me request forwarded successfully', { traceId, userId });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward get me request', { traceId, userId, error: error.message });
      throw error;
    }
  }

  async listUsers(filters: ListUsersRequestDto, traceId: string): Promise<UserListResponseDto> {
    this.logger.info('Forwarding list users request', { traceId, page: filters.page, limit: filters.limit, userName: filters.userName });
    try {
      const result = await this.rabbitMQService.sendToQueue<ListUsersRequestDto, UserListResponseDto>(
        this.usersQueue,
        UserRequestsRPCMessage.ListUsers,
        filters,
        traceId,
      );
      this.logger.info('List users request forwarded successfully', { traceId, page: filters.page, limit: filters.limit, userName: filters.userName });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward list users request', { traceId, page: filters.page, limit: filters.limit, userName: filters.userName, error: error.message });
      throw error;
    }
  }
}
