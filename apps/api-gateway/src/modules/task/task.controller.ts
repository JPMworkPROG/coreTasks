import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  AssignUsersBodyDto,
  ChangeTaskStatusBodyDto,
  CommentListResponseDto,
  CreateCommentBodyDto,
  CreateTaskBodyDto,
  ListTasksRequestDto,
  TaskDetailsResponseDto,
  TaskHistoryListResponseDto,
  TaskListResponseDto,
  TaskResponseDto,
  UpdateTaskBodyDto,
} from '@taskscore/types';
import { createLogger } from '@taskscore/utils';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';
import { TaskService } from './task.service';
import { Request } from 'express';
import { CommentListQueryDto, HistoryListQueryDto } from './task.controller.types';

@UseGuards(JwtAuthGuard)
@Controller('api/tasks')
export class TaskController {
  private readonly logger = createLogger({
    service: 'task-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly taskService: TaskService) {}

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() body: CreateTaskBodyDto, @Req() req: Request): Promise<TaskResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.info('HTTP: create task request received', {
      correlationId,
      userId: actorId,
      title: body.title,
    });

    return this.taskService.createTask(body, actorId, correlationId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listTasks(@Query() query: ListTasksRequestDto, @Req() req: Request): Promise<TaskListResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.debug('HTTP: list tasks request received', {
      correlationId,
      userId: actorId,
      page: query.page,
      limit: query.limit,
      status: query.status,
    });

    return this.taskService.listTasks(query, actorId, correlationId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTaskDetails(@Param('id') taskId: string, @Req() req: Request): Promise<TaskDetailsResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.debug('HTTP: get task details request received', {
      correlationId,
      userId: actorId,
      taskId,
    });

    return this.taskService.getTaskDetails(taskId, actorId, correlationId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateTask(
    @Param('id') taskId: string,
    @Body() body: UpdateTaskBodyDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.info('HTTP: update task request received', {
      correlationId,
      userId: actorId,
      taskId,
    });

    return this.taskService.updateTask(taskId, body, actorId, correlationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id') taskId: string, @Req() req: Request): Promise<void> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.warn('HTTP: delete task request received', {
      correlationId,
      userId: actorId,
      taskId,
    });

    await this.taskService.deleteTask(taskId, actorId, correlationId);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') taskId: string,
    @Body() body: CreateCommentBodyDto,
    @Req() req: Request,
  ): Promise<TaskDetailsResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.info('HTTP: create comment request received', {
      correlationId,
      userId: actorId,
      taskId,
    });

    return this.taskService.createComment(taskId, body, actorId, correlationId);
  }

  @Get(':id/comments')
  @HttpCode(HttpStatus.OK)
  async listComments(
    @Param('id') taskId: string,
    @Query() query: CommentListQueryDto,
    @Req() req: Request,
  ): Promise<CommentListResponseDto> {
    const correlationId = req['correlationId'];

    this.logger.debug('HTTP: list comments request received', {
      correlationId,
      taskId,
      page: query.page,
      limit: query.limit,
    });

    return this.taskService.listComments(
      { page: query.page, limit: query.limit },
      taskId,
      correlationId,
    );
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignUsers(
    @Param('id') taskId: string,
    @Body() body: AssignUsersBodyDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.info('HTTP: assign users request received', {
      correlationId,
      userId: actorId,
      taskId,
      assignees: body.userIds.length,
    });

    return this.taskService.assignUsers(taskId, body, actorId, correlationId);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') taskId: string,
    @Body() body: ChangeTaskStatusBodyDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const correlationId = req['correlationId'];
    const { id: actorId } = this.getActor(req);

    this.logger.info('HTTP: change task status request received', {
      correlationId,
      userId: actorId,
      taskId,
      status: body.status,
    });

    return this.taskService.changeStatus(taskId, body, actorId, correlationId);
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  async listHistory(
    @Param('id') taskId: string,
    @Query() query: HistoryListQueryDto,
    @Req() req: Request,
  ): Promise<TaskHistoryListResponseDto> {
    const correlationId = req['correlationId'];

    this.logger.debug('HTTP: list task history request received', {
      correlationId,
      taskId,
      page: query.page,
      limit: query.limit,
    });

    return this.taskService.listHistory(
      { page: query.page, limit: query.limit },
      taskId,
      correlationId,
    );
  }
}
