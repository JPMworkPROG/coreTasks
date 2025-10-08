# Notification Service

> Microservice responsible for real-time notifications

**Port**: `3003` | **Protocol**: WebSocket + RabbitMQ Events | **Database**: PostgreSQL (shared)

## Overview

The Notification Service handles real-time notifications via WebSocket and listens to events from other services to notify connected users.

## Features

- ✅ WebSocket connections for real-time updates
- ✅ Event-driven notifications (Task created, updated, assigned, etc.)
- ✅ Notification history
- ✅ User-specific notifications
- ✅ Mark as read/unread

## Event Subscriptions

| Event | Description |
|-------|-------------|
| `task.created` | Task was created |
| `task.updated` | Task was updated |
| `task.assigned` | User was assigned to task |
| `task.status-changed` | Task status changed |
| `comment.created` | Comment was added |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Client → Server | Establish connection |
| `notification` | Server → Client | New notification |
| `notification.read` | Client → Server | Mark as read |

## Environment Variables

```env
NODE_ENV=development
NOTIFICATION_SERVICE_PORT=3003

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=coreTask

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_NOTIFICATIONS_QUEUE=notifications.queue

WEBSOCKET_PORT=3003
WEBSOCKET_PATH=/socket.io
CORS_ORIGIN=http://localhost:8080,http://localhost:8081
```

## Running

```bash
npm install
npm run start:dev
```

[← Back to Main README](../../README.md)
