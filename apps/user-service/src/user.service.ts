import { Injectable } from '@nestjs/common';
import { createLogger } from '@taskscore/utils';
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

  async getUserById(request: GetUserByIdRequestDto, correlationId: string): Promise<UserResponseDto> {
    this.logger.debug('Processing get user by ID request', {
      correlationId,
      userId: request.userId,
    });

    const user = await this.userRepository.findUserById(request.userId);
    return mapUserEntityToResponse(user);
  }

  async listUsers(request: ListUsersRequestDto, correlationId: string): Promise<UserListResponseDto> {
    const page = this.normalizePage(request.page);
    const limit = this.normalizeLimit(request.limit);

    this.logger.debug('Processing list users request', {
      correlationId,
      page,
      limit,
      userName: request.userName,
    });

    const result = await this.userRepository.listUsers({
      page,
      limit,
      userName: request.userName,
    });

    const meta = this.buildPaginationMeta({ page, limit, total: result.total });

    return {
      data: mapUsersToResponse(result.data),
      meta,
      success: true,
    };
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
