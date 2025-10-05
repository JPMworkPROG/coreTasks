import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationMetadataDto } from './commonTypes';

export enum TaskPriorityDto {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Urgent = 'URGENT',
}

export enum TaskStatusDto {
  Todo = 'TODO',
  InProgress = 'IN_PROGRESS',
  Review = 'REVIEW',
  Done = 'DONE',
  Cancelled = 'CANCELLED',
}

export enum TaskHistoryActionDto {
  Created = 'TASK_CREATED',
  Updated = 'TASK_UPDATED',
  StatusChanged = 'TASK_STATUS_CHANGED',
  Assigned = 'TASK_ASSIGNED',
  Unassigned = 'TASK_UNASSIGNED',
  Commented = 'TASK_COMMENTED',
  Completed = 'TASK_COMPLETED',
  Cancelled = 'TASK_CANCELLED',
  Deleted = 'TASK_DELETED',
}

export class CreateTaskBodyDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(180, { message: 'Title must not exceed 180 characters' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO 8601 date string' })
  dueDate?: string;

  @IsEnum(TaskPriorityDto, { message: 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT' })
  priority: TaskPriorityDto = TaskPriorityDto.Medium;

  @IsOptional()
  @IsEnum(TaskStatusDto, { message: 'Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED' })
  status?: TaskStatusDto;

  @IsOptional()
  @IsObject({ message: 'Meta must be an object' })
  meta?: Record<string, unknown> | null;
}

export class CreateTaskRequestDto {
  @ValidateNested()
  @Type(() => CreateTaskBodyDto)
  data!: CreateTaskBodyDto;

  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId!: string;

  @IsOptional()
  @IsArray({ message: 'Assignee IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each assignee ID must be a valid UUID' })
  assigneeIds?: string[];
}

export class ListTasksRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number;

  @IsOptional()
  @IsEnum(TaskStatusDto, { message: 'Status filter must be a valid value' })
  status?: TaskStatusDto;

  @IsOptional()
  @IsEnum(TaskPriorityDto, { message: 'Priority filter must be a valid value' })
  priority?: TaskPriorityDto;

  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @IsOptional()
  @IsUUID('4', { message: 'assignedTo must be a valid UUID' })
  assignedTo?: string;

  @IsOptional()
  @IsUUID('4', { message: 'createdBy must be a valid UUID' })
  createdBy?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId?: string;
}

export class GetTaskDetailsRequestDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @IsOptional()
  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId?: string;
}

export class UpdateTaskBodyDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(180, { message: 'Title must not exceed 180 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO 8601 date string' })
  dueDate?: string | null;

  @IsOptional()
  @IsEnum(TaskPriorityDto, { message: 'Priority must be one of: LOW, MEDIUM, HIGH, URGENT' })
  priority?: TaskPriorityDto;

  @IsOptional()
  @IsEnum(TaskStatusDto, { message: 'Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED' })
  status?: TaskStatusDto;

  @IsOptional()
  @IsObject({ message: 'Meta must be an object' })
  meta?: Record<string, unknown> | null;
}

export class UpdateTaskRequestDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @ValidateNested()
  @Type(() => UpdateTaskBodyDto)
  data!: UpdateTaskBodyDto;

  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId!: string;
}

export class DeleteTaskRequestDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId!: string;
}

export class CreateCommentBodyDto {
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
  content!: string;
}

export class CreateCommentRequestDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @ValidateNested()
  @Type(() => CreateCommentBodyDto)
  data!: CreateCommentBodyDto;

  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId!: string;
}

export class ListCommentsRequestDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number;
}

export class AssignUsersBodyDto {
  @IsArray({ message: 'userIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID' })
  userIds!: string[];
}

export class AssignUsersRequestDto extends AssignUsersBodyDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId!: string;
}

export class ChangeTaskStatusBodyDto {
  @IsEnum(TaskStatusDto, { message: 'Status must be a valid value' })
  status!: TaskStatusDto;

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;
}

export class ChangeTaskStatusRequestDto extends ChangeTaskStatusBodyDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @IsUUID('4', { message: 'Actor ID must be a valid UUID' })
  actorId!: string;
}

export class ListHistoryRequestDto {
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  taskId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number;
}

export class UserInfoDto {
  @IsUUID('4')
  id!: string;

  @IsString()
  username!: string;

  @IsString()
  email!: string;
}

export class TaskAssignmentResponseDto {
  @ValidateNested()
  @Type(() => UserInfoDto)
  user!: UserInfoDto;

  @ValidateNested()
  @Type(() => UserInfoDto)
  assignedBy!: UserInfoDto;

  @IsDateString()
  assignedAt!: string;
}

export class TaskCommentResponseDto {
  @IsUUID('4')
  id!: string;

  @IsUUID('4')
  taskId!: string;

  @ValidateNested()
  @Type(() => UserInfoDto)
  author!: UserInfoDto;

  @IsString()
  content!: string;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;
}

export class TaskHistoryEntryResponseDto {
  @IsUUID('4')
  id!: string;

  @IsUUID('4')
  taskId!: string;

  @IsEnum(TaskHistoryActionDto)
  action!: TaskHistoryActionDto;

  @ValidateNested()
  @Type(() => UserInfoDto)
  performedBy!: UserInfoDto;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @IsDateString()
  createdAt!: string;
}

export class TaskResponseDto {
  @IsUUID('4')
  id!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsEnum(TaskPriorityDto)
  priority!: TaskPriorityDto;

  @IsEnum(TaskStatusDto)
  status!: TaskStatusDto;

  @ValidateNested()
  @Type(() => UserInfoDto)
  createdBy!: UserInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserInfoDto)
  updatedBy?: UserInfoDto | null;

  @IsOptional()
  @IsDateString()
  completedAt?: string | null;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown> | null;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskAssignmentResponseDto)
  assignments!: TaskAssignmentResponseDto[];
}

export class TaskDetailsResponseDto extends TaskResponseDto {
  // Comments e history devem ser obtidos via endpoints específicos:
  // GET /api/tasks/{id}/comments e GET /api/tasks/{id}/history
}

export class TaskListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskResponseDto)
  data!: TaskResponseDto[];

  @ValidateNested()
  @Type(() => PaginationMetadataDto)
  meta!: PaginationMetadataDto;

  success: boolean = true;

  @IsOptional()
  @IsString()
  message?: string | null;

  @IsOptional()
  @IsString()
  error?: string | null;
}

export class CommentListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskCommentResponseDto)
  data!: TaskCommentResponseDto[];

  @ValidateNested()
  @Type(() => PaginationMetadataDto)
  meta!: PaginationMetadataDto;

  success: boolean = true;

  @IsOptional()
  @IsString()
  message?: string | null;

  @IsOptional()
  @IsString()
  error?: string | null;
}

export class TaskHistoryListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskHistoryEntryResponseDto)
  data!: TaskHistoryEntryResponseDto[];

  @ValidateNested()
  @Type(() => PaginationMetadataDto)
  meta!: PaginationMetadataDto;

  success: boolean = true;

  @IsOptional()
  @IsString()
  message?: string | null;

  @IsOptional()
  @IsString()
  error?: string | null;
}
