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
  async getUserById(data: { payload: GetUserByIdRequestDto; traceId: string }): Promise<UserResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('Get user by ID request received', { traceId, userId: payload.userId });
    const result = await this.userService.getUserById(payload, traceId);
    this.logger.info('Get user by ID completed successfully', { traceId, userId: payload.userId, username: result.username });
    return result;
  }

  @MessagePattern(UserRequestsRPCMessage.ListUsers)
  async listUsers(data: { payload: ListUsersRequestDto; traceId: string }): Promise<UserListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('List users request received', { traceId, page: payload.page, limit: payload.limit, userName: payload.userName });
    const result = await this.userService.listUsers(payload, traceId);
    this.logger.info('List users completed successfully', { traceId, total: result.meta.total, page: payload.page, returned: result.data.length });
    return result;
  }
}
