# Task Service

> Microservice responsible for all task-related operations

**Port**: `3001` | **Protocol**: RabbitMQ RPC | **Database**: PostgreSQL (shared)

## Overview

The Task Service manages the complete lifecycle of tasks including creation, updates, assignments, status tracking, comments, and history.

## Features

- ✅ CRUD operations for tasks
- ✅ Task assignments to users
- ✅ Status management (todo, in_progress, done, etc.)
- ✅ Comments system
- ✅ Task history/audit trail
- ✅ Filtering and pagination

## RPC Endpoints

| Pattern | Description |
|---------|-------------|
| `tasks.create` | Create new task |
| `tasks.list` | List tasks with filters |
| `tasks.get-details` | Get task by ID |
| `tasks.update` | Update task |
| `tasks.delete` | Delete task |
| `tasks.create-comment` | Add comment |
| `tasks.list-comments` | List comments |
| `tasks.assign-users` | Assign users to task |
| `tasks.change-status` | Change task status |
| `tasks.list-history` | Get task history |

## Environment Variables

```env
NODE_ENV=development
TASK_SERVICE_PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=coreTask

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_TASKS_QUEUE=tasks.queue
```

## Running

```bash
npm install
npm run start:dev
```

[← Back to Main README](../../README.md)
