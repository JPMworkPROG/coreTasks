# @taskscore/utils

> Shared utilities, entities, logger, and database client

## Overview

This package provides shared utilities used across all microservices in the coreTasks system.

## Contents

- **Database**: TypeORM entities and database client
- **Logger**: Structured logging with Winston
- **RPC Client**: RabbitMQ communication helpers
- **Problem Details**: RFC 7807 error format
- **Helpers**: Common utility functions

## Structure

```
src/
├── database/
│   ├── entities/
│   │   ├── task.ts
│   │   ├── user.ts
│   │   ├── taskComment.ts
│   │   └── taskHistory.ts
│   ├── databaseClient.ts
│   └── migrations/
├── logger.ts
├── rpc/
│   └── rpcClient.ts
├── problemDetails.ts
└── index.ts
```

## Usage

### Logger

```typescript
import { createLogger } from '@taskscore/utils'

const logger = createLogger({
  service: 'my-service',
  environment: process.env.NODE_ENV
})

logger.info('Operation started', { traceId, userId })
logger.error('Operation failed', { traceId, error })
```

### Database Client

```typescript
import { createDatabaseClient } from '@taskscore/utils'

const dbClient = createDatabaseClient()
await dbClient.connect()
```

### RPC Client

```typescript
import { sendRpc } from '@taskscore/utils'

const result = await sendRpc(
  client,
  'tasks.create',
  { title: 'New task' },
  traceId
)
```

### Problem Details

```typescript
import { createProblemDetails } from '@taskscore/utils'

throw createProblemDetails({
  status: 404,
  title: 'Not Found',
  detail: 'Task not found',
  traceId
})
```

### Entities

```typescript
import { Task, User, TaskComment } from '@taskscore/utils'

// Use with TypeORM
@InjectRepository(Task)
private taskRepo: Repository<Task>
```

[← Back to Main README](../../../README.md)
