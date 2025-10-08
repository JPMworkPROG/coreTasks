# API Gateway

> HTTP to RPC Gateway - Entry point for all client requests

## 📋 Overview

The API Gateway serves as the **single entry point** for all HTTP requests from the frontend. It handles authentication, request validation, and forwards requests to appropriate microservices via RabbitMQ RPC.

**Port**: `3000`
**Protocol**: HTTP/REST → RabbitMQ RPC

## 🏗️ Architecture

```
┌─────────┐                ┌─────────────┐                ┌──────────────┐
│ Client  │───── HTTP ────►│ API Gateway │──── RPC ──────►│ Microservice │
│ (React) │                │ (NestJS)    │   (RabbitMQ)   │ (NestJS)     │
└─────────┘                └─────────────┘                └──────────────┘
```

## 🎯 Responsibilities

- ✅ **HTTP Endpoint**: Exposes REST API for frontend
- ✅ **Authentication**: Validates JWT tokens (Access/Refresh)
- ✅ **Request Validation**: Validates DTOs using class-validator
- ✅ **RPC Proxy**: Forwards requests to microservices via RabbitMQ
- ✅ **Response Transformation**: Transforms microservice responses to HTTP
- ✅ **Error Handling**: Translates RPC errors to HTTP errors
- ✅ **Trace ID Generation**: Adds traceId to every request for distributed tracing

## 📂 Project Structure

```
apps/api-gateway/
├── src/
│   ├── config/
│   │   ├── envLoader.config.ts      # Environment configuration
│   │   └── throttler.module.ts      # Rate limiting config
│   ├── guards/
│   │   ├── jwtAcess.guard.ts        # JWT access token guard
│   │   ├── jwtRefresh.guard.ts      # JWT refresh token guard
│   │   └── strategies/
│   │       ├── jwtAcess.strategy.ts
│   │       └── jwtRefresh.strategy.ts
│   ├── middlewares/
│   │   └── traceId.middleware.ts    # Trace ID middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts   # Auth HTTP endpoints
│   │   │   ├── auth.service.ts      # Auth RPC client
│   │   │   └── auth.module.ts
│   │   ├── task/
│   │   │   ├── task.controller.ts
│   │   │   ├── task.service.ts
│   │   │   └── task.module.ts
│   │   └── user/
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       └── user.module.ts
│   ├── rabbitmq/
│   │   ├── rabbitmq.module.ts       # RabbitMQ configuration
│   │   └── rabbitmq.service.ts      # RPC send utility
│   ├── app.module.ts
│   └── main.ts
├── .env
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |

### Tasks (`/api/tasks`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/tasks` | Create task | ✅ |
| GET | `/api/tasks` | List tasks (with filters) | ✅ |
| GET | `/api/tasks/:id` | Get task details | ✅ |
| PUT | `/api/tasks/:id` | Update task | ✅ |
| DELETE | `/api/tasks/:id` | Delete task | ✅ |
| POST | `/api/tasks/:id/comments` | Add comment | ✅ |
| GET | `/api/tasks/:id/comments` | List comments | ✅ |
| POST | `/api/tasks/:id/assign` | Assign users | ✅ |
| POST | `/api/tasks/:id/status` | Change status | ✅ |
| GET | `/api/tasks/:id/history` | Get task history | ✅ |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user | ✅ |
| PUT | `/api/users/me` | Update current user | ✅ |
| GET | `/api/users` | List users | ✅ |
| GET | `/api/users/:id` | Get user by ID | ✅ |

## 🔐 Authentication Flow

### JWT Strategy

```typescript
// Access Token Guard
@UseGuards(JwtAccessGuard)
@Get('protected')
async protectedRoute(@Request() req) {
  // req.user contains decoded JWT payload
  return { userId: req.user.id };
}
```

The API Gateway uses **two JWT strategies**:

1. **Access Token** (`JwtAccessGuard`):
   - Short-lived (15 minutes)
   - Used for API requests
   - Validated on every protected endpoint

2. **Refresh Token** (`JwtRefreshGuard`):
   - Long-lived (7 days)
   - Used only for token refresh
   - Stored securely on client

## 🔄 RPC Communication

### Pattern

All microservice communication follows this pattern:

```typescript
// Gateway Service
async createTask(dto: CreateTaskDto, userId: string, traceId: string) {
  const payload = { data: dto, userId };

  return await this.rabbitMQService.sendToQueue(
    this.tasksQueue,
    TaskRequestsRPCMessage.CreateTask,
    payload,
    traceId
  );
}
```

### Message Format

```typescript
// RPC Request
{
  payload: {
    // Request data
  },
  traceId: "uuid-v4"
}

// RPC Response
{
  // Response data directly
  id: "...",
  title: "...",
  ...
}
```

## 🚀 Running the Service

### Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev

# Start in debug mode
npm run start:debug
```

### Production

```bash
# Build
npm run build

# Start
npm run start:prod
```

### Docker

```bash
# Build and run
docker-compose up api-gateway --build

# View logs
docker-compose logs -f api-gateway
```

## 🔧 Environment Variables

Create `.env` file in `apps/api-gateway/`:

```env
# Application
NODE_ENV=development
PORT=3000

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_TASKS_QUEUE=tasks.queue
RABBITMQ_USERS_QUEUE=users.queue
RABBITMQ_AUTH_QUEUE=auth.queue

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
```

## 📊 Request Flow Example

### Create Task Request

1. **Client sends HTTP POST** to `/api/tasks`:
   ```json
   {
     "title": "Implement API",
     "description": "Build REST API",
     "priority": "high"
   }
   ```

2. **Gateway validates JWT** via `JwtAccessGuard`

3. **TraceId middleware** adds `traceId` to request

4. **Controller validates DTO** using `class-validator`

5. **Service sends RPC** to Task Service:
   ```typescript
   sendRpc(client, 'tasks.create', {
     data: { title, description, priority },
     userId: req.user.id
   }, traceId)
   ```

6. **Task Service processes** and returns response

7. **Gateway returns HTTP response** to client:
   ```json
   {
     "id": "uuid",
     "title": "Implement API",
     "description": "Build REST API",
     "priority": "high",
     "status": "todo",
     "createdAt": "2025-01-15T10:00:00Z"
   }
   ```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🔍 Debugging

### Enable Debug Logs

```bash
LOG_LEVEL=debug npm run start:dev
```

### Trace a Request

Every request gets a `traceId`. Find it in logs:

```
[TaskController] info: create task request received {"traceId":"abc-123-def","userId":"user-1"}
```

Use `traceId` to trace the request across all microservices.

## 🛡️ Security

- ✅ **JWT Authentication**: All protected routes require valid access token
- ✅ **Rate Limiting**: Configurable via `THROTTLE_*` env vars
- ✅ **CORS**: Configured for frontend origins
- ✅ **Helmet**: Security headers enabled
- ✅ **Validation**: All inputs validated with class-validator
- ✅ **Error Sanitization**: Sensitive data removed from error responses

## 📈 Performance

- **Connection Pooling**: RabbitMQ channels reused
- **Request Timeout**: 30s default (configurable)
- **Graceful Shutdown**: Handles SIGTERM/SIGINT
- **Health Checks**: `/health` endpoint for monitoring

## 📝 Development Tips

1. **Add New Endpoint**:
   - Create controller method
   - Create service method with RPC call
   - Update module providers if needed

2. **Add Authentication**:
   ```typescript
   @UseGuards(JwtAccessGuard)
   @Get('protected')
   async route(@Request() req) {
     const userId = req.user.id;
     // ...
   }
   ```

3. **Access Current User**:
   ```typescript
   @Request() req: Request
   // req.user = { id, email, username }
   ```

4. **Get Trace ID**:
   ```typescript
   @Request() req: Request
   // req['traceId'] = uuid
   ```

## 🔗 Related Documentation

- [Main README](../../README.md)
- [CLAUDE.md](../../CLAUDE.md) - Development guide
- [Task Service](../task-service/README.md)
- [Auth Service](../auth-service/README.md)
- [User Service](../user-service/README.md)

## 🐛 Troubleshooting

**Issue**: "Connection refused to RabbitMQ"
```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Check connection URL
echo $RABBITMQ_URL
```

**Issue**: "JWT token invalid"
```bash
# Verify JWT secrets match in Auth Service
# Check token expiration times
```

**Issue**: "Microservice timeout"
```bash
# Check microservice is running
# Increase RPC timeout in config
# Check RabbitMQ queue exists
```

---

[← Back to Main README](../../README.md)
