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
import { JwtAcessGuard } from '../../guards/jwtAcess.guard';
import { TaskService } from './task.service';
import { Request } from 'express';
import { CommentListQueryDto, HistoryListQueryDto } from '@taskscore/types';

@UseGuards(JwtAcessGuard)
@Controller('api/tasks')
export class TaskController {
  private readonly logger = createLogger({
    service: 'task-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly taskService: TaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() body: CreateTaskBodyDto, @Req() req: Request): Promise<TaskResponseDto> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.info('create task request received', { traceId, title: body.title });
    const result = await this.taskService.createTask(body, userId, traceId);
    this.logger.info('create task completed successfully', { traceId, title: body.title });
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listTasks(@Query() query: ListTasksRequestDto, @Req() req: Request): Promise<TaskListResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('list tasks request received', { traceId, page: query.page, limit: query.limit, status: query.status });
    const result = await this.taskService.listTasks(query, traceId);
    this.logger.info('list tasks completed successfully', { traceId });
    return result;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTaskDetails(@Param('id') taskId: string, @Req() req: Request): Promise<TaskDetailsResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('get task details request received', { traceId, taskId });
    const result = await this.taskService.getTaskDetails(taskId, traceId);
    this.logger.info('get task details completed successfully', { traceId, taskId });
    return result;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateTask(
    @Param('id') taskId: string,
    @Body() body: UpdateTaskBodyDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.info('update task request received', { traceId, taskId });
    const result = await this.taskService.updateTask(taskId, body, userId, traceId);
    this.logger.info('update task completed successfully', { traceId, taskId });
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id') taskId: string, @Req() req: Request): Promise<void> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.warn('delete task request received', { traceId, taskId });
    await this.taskService.deleteTask(taskId, userId, traceId);
    this.logger.warn('delete task completed successfully', { traceId, taskId });
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') taskId: string,
    @Body() body: CreateCommentBodyDto,
    @Req() req: Request,
  ): Promise<TaskDetailsResponseDto> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.info('create comment request received', { traceId, taskId });
    const result = await this.taskService.createComment(taskId, body, userId, traceId);
    this.logger.info('create comment completed successfully', { traceId, taskId });
    return result;
  }

  @Get(':id/comments')
  @HttpCode(HttpStatus.OK)
  async listComments(
    @Param('id') taskId: string,
    @Query() query: CommentListQueryDto,
    @Req() req: Request,
  ): Promise<CommentListResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('list comments request received', { traceId, taskId, page: query.page, limit: query.limit });
    const result = await this.taskService.listComments(
      { page: query.page, limit: query.limit },
      taskId,
      traceId,
    );
    this.logger.info('list comments completed successfully', { traceId, taskId });
    return result;
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignUsers(
    @Param('id') taskId: string,
    @Body() body: AssignUsersBodyDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.info('assign users request received', { traceId, taskId, assignees: body.userIds.length });
    const result = await this.taskService.assignUsers(taskId, body, userId, traceId);
    this.logger.info('assign users completed successfully', { traceId, taskId });
    return result;
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') taskId: string,
    @Body() body: ChangeTaskStatusBodyDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const traceId = req['traceId'];
    const userId = req['user']['id']
    this.logger.info('change task status request received', { traceId, taskId, status: body.status });
    const result = await this.taskService.changeStatus(taskId, body, userId, traceId);
    this.logger.info('change task status completed successfully', { traceId, taskId });
    return result;
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  async listHistory(
    @Param('id') taskId: string,
    @Query() query: HistoryListQueryDto,
    @Req() req: Request,
  ): Promise<TaskHistoryListResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('list task history request received', { traceId, taskId, page: query.page, limit: query.limit });
    const result = await this.taskService.listHistory(
      { page: query.page, limit: query.limit },
      taskId,
      traceId,
    );
    this.logger.info('list task history completed successfully', { traceId, taskId });
    return result;
  }
}