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
    this.logger.debug('Fetching user by ID', { userId: id });

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn('User not found', { userId: id });
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async listUsers(params: ListUsersParams): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { page, limit, userName } = params;

    this.logger.debug('Listing users', { page, limit, userName });

    const qb = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');

    if (userName) {
      qb.where('user.username ILIKE :userName', { userName: `%${userName}%` });
    }

    const offset = (page - 1) * limit;
    const [data, total] = await qb.skip(offset).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }
}
