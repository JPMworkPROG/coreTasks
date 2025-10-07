import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { createLogger } from '@taskscore/utils';
import { JwtAcessGuard } from '../../guards/jwtAcess.guard';
import { UserService } from './user.service';
import { UserListResponseDto, UserResponseDto, ListUsersRequestDto } from '@taskscore/types';

@UseGuards(JwtAcessGuard)
@Controller('api/users')
export class UserController {
  private readonly logger = createLogger({
    service: 'user-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly userService: UserService) { }
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.info('Get me request received', { traceId, userId });
    const result = await this.userService.getMe(userId, traceId);
    this.logger.info('Get me completed successfully', { traceId, userId });
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listUsers(@Query() query: ListUsersRequestDto, @Req() req: Request): Promise<UserListResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('List users request received', {traceId,page: query.page,limit: query.limit,userName: query.userName});
    const result = await this.userService.listUsers(query, traceId);
    this.logger.info('List users completed successfully', { traceId, page: query.page, limit: query.limit, userName: query.userName });
    return result;
  }
}