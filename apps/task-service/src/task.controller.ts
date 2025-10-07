import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { createLogger, normalizeError } from '@taskscore/utils';
import {
  AssignUsersRequestDto,
  ChangeTaskStatusRequestDto,
  CommentListResponseDto,
  CreateCommentRequestDto,
  CreateTaskRequestDto,
  DeleteTaskRequestDto,
  GetTaskDetailsRequestDto,
  ListCommentsRequestDto,
  ListHistoryRequestDto,
  ListTasksRequestDto,
  TaskHistoryListResponseDto,
  TaskListResponseDto,
  TaskRequestsRPCMessage,
  TaskResponseDto,
  UpdateTaskRequestDto,
} from '@taskscore/types';
import { TaskService } from './task.service';

@Controller()
export class TaskController {
  private readonly logger = createLogger({
    service: 'task-controller',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly taskService: TaskService) {}

  @MessagePattern(TaskRequestsRPCMessage.CreateTask)
  async createTask(data: { payload: CreateTaskRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('Create task request received', { traceId, title: payload.data.title, userId: payload.userId });
    const result = await this.taskService.createTask(payload, traceId);
    this.logger.info('Create task completed successfully', { traceId, taskId: result.id, title: payload.data.title });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.ListTasks)
  async listTasks(data: { payload: ListTasksRequestDto; traceId: string }): Promise<TaskListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('List tasks request received', { traceId, page: payload.page, limit: payload.limit, status: payload.status });
    const result = await this.taskService.listTasks(payload, traceId);
    this.logger.info('List tasks completed successfully', { traceId, total: result.meta.total, page: payload.page });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.GetTaskDetails)
  async getTaskDetails(data: { payload: GetTaskDetailsRequestDto; traceId: string }) {
    const { payload, traceId } = data;
    this.logger.info('Get task details request received', { traceId, taskId: payload.taskId });
    const result = await this.taskService.getTaskDetails(payload, traceId);
    this.logger.info('Get task details completed successfully', { traceId, taskId: payload.taskId });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.UpdateTask)
  async updateTask(data: { payload: UpdateTaskRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('Update task request received', { traceId, taskId: payload.taskId, userId: payload.userId });
    const result = await this.taskService.updateTask(payload, traceId);
    this.logger.info('Update task completed successfully', { traceId, taskId: payload.taskId });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.DeleteTask)
  async deleteTask(data: { payload: DeleteTaskRequestDto; traceId: string }): Promise<void> {
    const { payload, traceId } = data;
    this.logger.warn('Delete task request received', { traceId, taskId: payload.taskId, userId: payload.userId });
    await this.taskService.deleteTask(payload, traceId);
    this.logger.warn('Delete task completed successfully', { traceId, taskId: payload.taskId });
  }

  @MessagePattern(TaskRequestsRPCMessage.CreateComment)
  async createComment(data: { payload: CreateCommentRequestDto; traceId: string }) {
    const { payload, traceId } = data;
    this.logger.info('Create comment request received', { traceId, taskId: payload.taskId, userId: payload.userId });
    const result = await this.taskService.createComment(payload, traceId);
    this.logger.info('Create comment completed successfully', { traceId, taskId: payload.taskId });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.ListComments)
  async listComments(data: { payload: ListCommentsRequestDto; traceId: string }): Promise<CommentListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('List comments request received', { traceId, taskId: payload.taskId, page: payload.page });
    const result = await this.taskService.listComments(payload, traceId);
    this.logger.info('List comments completed successfully', { traceId, taskId: payload.taskId, total: result.meta.total });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.AssignUsers)
  async assignUsers(data: { payload: AssignUsersRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('Assign users request received', { traceId, taskId: payload.taskId, userId: payload.userId, assignees: payload.userIds.length });
    const result = await this.taskService.assignUsers(payload, traceId);
    this.logger.info('Assign users completed successfully', { traceId, taskId: payload.taskId, assignees: payload.userIds.length });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.ChangeStatus)
  async changeStatus(data: { payload: ChangeTaskStatusRequestDto; traceId: string }): Promise<TaskResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('Change task status request received', { traceId, taskId: payload.taskId, status: payload.status });
    const result = await this.taskService.changeStatus(payload, traceId);
    this.logger.info('Change task status completed successfully', { traceId, taskId: payload.taskId, status: payload.status });
    return result;
  }

  @MessagePattern(TaskRequestsRPCMessage.ListHistory)
  async listHistory(data: { payload: ListHistoryRequestDto; traceId: string }): Promise<TaskHistoryListResponseDto> {
    const { payload, traceId } = data;
    this.logger.info('List history request received', { traceId, taskId: payload.taskId, page: payload.page });
    const result = await this.taskService.listHistory(payload, traceId);
    this.logger.info('List history completed successfully', { traceId, taskId: payload.taskId, total: result.meta.total });
    return result;
  }
}
