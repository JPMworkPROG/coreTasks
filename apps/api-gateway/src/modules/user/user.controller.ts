import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { createLogger } from '@taskscore/utils';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { UserService } from './user.service';
import { UserListResponseDto, UserResponseDto } from '@taskscore/types';
import { ListUsersQueryDto } from './user.controller.types';

@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UserController {
  private readonly logger = createLogger({
    service: 'user-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly userService: UserService) {}

  private getActor(req: Request): { id: string } {
    const user = req['user'] as { id?: string } | undefined;
    if (!user?.id) {
      this.logger.error('Authenticated user context missing', {
        correlationId: req['correlationId'],
      });
      throw new UnauthorizedException('User context is missing');
    }

    return { id: user.id };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.debug('HTTP: get me request received', {
      correlationId,
      userId: actorId,
    });

    return this.userService.getMe(actorId, correlationId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listUsers(@Query() query: ListUsersQueryDto, @Req() req: Request): Promise<UserListResponseDto> {
    const correlationId = req['correlationId'];

    this.logger.debug('HTTP: list users request received', {
      correlationId,
      page: query.page,
      limit: query.limit,
      userName: query.userName,
    });

    return this.userService.listUsers(query, correlationId);
  }
}
