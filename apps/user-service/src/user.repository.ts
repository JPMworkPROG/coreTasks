import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, createLogger } from '@taskscore/utils';

interface ListUsersParams {
  page: number;
  limit: number;
  userName?: string;
}

@Injectable()
export class UserRepository {
  private readonly logger = createLogger({
    service: 'user-repository',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserById(id: string): Promise<User> {
    try {
      this.logger.info('Searching user by ID', { userId: id });
      const user = await this.userRepository.findOne({ where: { id } });

      this.logger.info('User search by ID completed', {
        userId: id,
        found: !!user,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to find user by ID', {
        userId: id,
        error: errorMessage,
      });
      throw error;
    }
  }

  async listUsers(params: ListUsersParams): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    try {
      const { page, limit, userName } = params;
      this.logger.info('Listing users', { page, limit, userName });

      const qb = this.userRepository
        .createQueryBuilder('user')
        .orderBy('user.createdAt', 'DESC');

      if (userName) {
        qb.where('user.username ILIKE :userName', { userName: `%${userName}%` });
      }

      const offset = (page - 1) * limit;
      const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();

      this.logger.info('Users listed successfully', {
        page,
        limit,
        total,
        returned: data.length,
        userName,
      });

      return { data, total, page, limit };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to list users', {
        page: params.page,
        limit: params.limit,
        userName: params.userName,
        error: errorMessage,
      });
      throw error;
    }
  }
}
