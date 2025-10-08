# @taskscore/types

> Shared TypeScript types, DTOs, interfaces, enums, and RPC constants

## Overview

This package contains all shared types used across the coreTasks monorepo, ensuring type safety and consistency between services.

## Contents

- **DTOs**: Data Transfer Objects for API requests/responses
- **Interfaces**: TypeScript interfaces for contracts
- **Enums**: Shared enumerations (TaskStatus, TaskPriority, UserRole, etc.)
- **RPC Constants**: Message patterns for RabbitMQ communication

## Structure

```
src/
├── dtos/
│   ├── auth/
│   ├── task/
│   ├── user/
│   └── common/
├── enums/
├── interfaces/
├── constants/
└── index.ts
```

## Usage

### Install

```bash
npm install @taskscore/types
```

### Import

```typescript
import {
  CreateTaskDto,
  TaskStatus,
  TaskRequestsRPCMessage,
  type Task
} from '@taskscore/types'
```

## Examples

### DTOs

```typescript
import { IsString, IsEnum, IsOptional } from 'class-validator'
import { TaskStatus, TaskPriority } from '../enums'

export class CreateTaskDto {
  @IsString()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.TODO

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM
}
```

### Enums

```typescript
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

### RPC Constants

```typescript
export enum TaskRequestsRPCMessage {
  CreateTask = 'tasks.create',
  ListTasks = 'tasks.list',
  GetTaskDetails = 'tasks.get-details',
  UpdateTask = 'tasks.update',
  DeleteTask = 'tasks.delete'
}
```

[← Back to Main README](../../../README.md)
