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
import { JwtAcessGuard } from '../../guards/jwtAcess.guard';
import { UserService } from './user.service';
import { UserListResponseDto, UserResponseDto } from '@taskscore/types';
import { ListUsersQueryDto } from './user.controller.types';

@UseGuards(JwtAcessGuard)
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
        traceId: req['traceId'],
      });
      throw new UnauthorizedException('User context is missing');
    }

    return { id: user.id };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: Request): Promise<UserResponseDto> {
    const traceId = req['traceId'];
    const { id: actorId } = this.getActor(req);

    this.logger.debug('HTTP: get me request received', {
      traceId,
      userId: actorId,
    });

    return this.userService.getMe(actorId, traceId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listUsers(@Query() query: ListUsersQueryDto, @Req() req: Request): Promise<UserListResponseDto> {
    const traceId = req['traceId'];

    this.logger.debug('HTTP: list users request received', {
      traceId,
      page: query.page,
      limit: query.limit,
      userName: query.userName,
    });

    return this.userService.listUsers(query, traceId);
  }
}
