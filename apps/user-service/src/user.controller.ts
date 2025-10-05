import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { createLogger, normalizeError } from '@taskscore/utils';
import {
  GetUserByIdRequestDto,
  ListUsersRequestDto,
  UserListResponseDto,
  UserRequestsRPCMessage,
  UserResponseDto,
} from '@taskscore/types';
import { UserService } from './user.service';

@Controller()
export class UserController {
  private readonly logger = createLogger({
    service: 'user-controller',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly userService: UserService) {}

  @MessagePattern(UserRequestsRPCMessage.GetUserById)
  async getUserById(data: { payload: GetUserByIdRequestDto; correlationId: string }): Promise<UserResponseDto> {
    const { payload, correlationId } = data;

    this.logger.debug('RPC: get user by ID request received', {
      correlationId,
      userId: payload.userId,
    });

    try {
      return await this.userService.getUserById(payload, correlationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: get user by ID failed', {
        correlationId,
        userId: payload.userId,
        error: errorMessage,
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to fetch user',
      });
    }
  }

  @MessagePattern(UserRequestsRPCMessage.ListUsers)
  async listUsers(data: { payload: ListUsersRequestDto; correlationId: string }): Promise<UserListResponseDto> {
    const { payload, correlationId } = data;

    this.logger.debug('RPC: list users request received', {
      correlationId,
      page: payload.page,
      limit: payload.limit,
      userName: payload.userName,
    });

    try {
      return await this.userService.listUsers(payload, correlationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: list users failed', {
        correlationId,
        page: payload.page,
        limit: payload.limit,
        userName: payload.userName,
        error: errorMessage,
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Failed to list users',
      });
    }
  }
}
