import { Injectable } from '@nestjs/common';
import { createLogger, normalizeError } from '@taskscore/utils';
import {
  GetUserByIdRequestDto,
  ListUsersRequestDto,
  PaginationMetadataDto,
  UserListResponseDto,
  UserResponseDto,
} from '@taskscore/types';
import { UserRepository } from './user.repository';
import { mapUserEntityToResponse, mapUsersToResponse } from './user.mapper';

@Injectable()
export class UserService {
  private readonly logger = createLogger({
    service: 'user-service',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(request: GetUserByIdRequestDto, traceId: string): Promise<UserResponseDto> {
    this.logger.info('Processing user retrieval', { traceId, userId: request.userId });

    try {
      const user = await this.userRepository.findUserById(request.userId);
      const result = mapUserEntityToResponse(user);
      this.logger.info('User retrieval completed successfully', { traceId, userId: request.userId, username: result.username });
      return result;
    } catch (error: any) {
      this.logger.error('User retrieval failed', {
        traceId,
        userId: request.userId,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'User retrieval failed' });
    }
  }

  async listUsers(request: ListUsersRequestDto, traceId: string): Promise<UserListResponseDto> {
    this.logger.info('Processing user listing', { traceId, page: request.page, limit: request.limit, userName: request.userName });

    try {
      const page = this.normalizePage(request.page);
      const limit = this.normalizeLimit(request.limit);

      const result = await this.userRepository.listUsers({
        page,
        limit,
        userName: request.userName,
      });

      const meta = this.buildPaginationMeta({ page, limit, total: result.total });

      const response = {
        data: mapUsersToResponse(result.data),
        meta,
        success: true,
      };

      this.logger.info('User listing completed successfully', { traceId, total: meta.total, page: meta.page, returned: result.data.length });
      return response;
    } catch (error: any) {
      this.logger.error('User listing failed', {
        traceId,
        page: request.page,
        limit: request.limit,
        userName: request.userName,
        error: { message: error.message, stack: error.stack }
      });
      throw normalizeError(error, { traceId, fallbackMessage: 'User listing failed' });
    }
  }

  private normalizePage(page?: number): number {
    if (!page || Number.isNaN(page) || page < 1) {
      return 1;
    }
    return Math.floor(page);
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit) || limit < 1) {
      return 10;
    }
    return Math.min(Math.floor(limit), 100);
  }

  private buildPaginationMeta({ page, limit, total }: { page: number; limit: number; total: number }): PaginationMetadataDto {
    const totalPages = Math.max(1, Math.ceil(total / limit || 1));
    return {
      page,
      limit,
      total,
      totalPages,
    };
  }
}
