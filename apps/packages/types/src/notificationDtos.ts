import { IsOptional, IsString, IsUUID } from 'class-validator';

// Event types for RabbitMQ
export enum NotificationEventType {
  TaskCreated = 'task.created',
  TaskUpdated = 'task.updated',
  TaskDeleted = 'task.deleted',
  TaskAssigned = 'task.assigned',
  CommentCreated = 'comment.created',
}

// Event payloads for RabbitMQ
export class TaskCreatedEventDto {
  @IsUUID('4')
  taskId!: string;

  @IsString()
  title!: string;

  @IsUUID('4')
  createdBy!: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  assignedTo?: string[];
}

export class TaskUpdatedEventDto {
  @IsUUID('4')
  taskId!: string;

  @IsString()
  title!: string;

  @IsUUID('4')
  updatedBy!: string;

  @IsOptional()
  changes?: Record<string, unknown>;
}

export class TaskDeletedEventDto {
  @IsUUID('4')
  taskId!: string;

  @IsString()
  title!: string;

  @IsUUID('4')
  deletedBy!: string;
}

export class TaskAssignedEventDto {
  @IsUUID('4')
  taskId!: string;

  @IsString()
  title!: string;

  @IsUUID('4', { each: true })
  assignedTo!: string[];

  @IsUUID('4')
  assignedBy!: string;
}

export class CommentCreatedEventDto {
  @IsUUID('4')
  taskId!: string;

  @IsString()
  taskTitle!: string;

  @IsUUID('4')
  commentId!: string;

  @IsUUID('4')
  authorId!: string;

  @IsString()
  authorName!: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  participants?: string[];
}

