# User Service

> Microservice responsible for user management

**Port**: `3004` | **Protocol**: RabbitMQ RPC | **Database**: PostgreSQL (shared)

## Overview

The User Service handles user profile operations, user search, and user listing.

## Features

- ✅ Get user profile
- ✅ Update user profile
- ✅ List users with pagination
- ✅ Search users

## RPC Endpoints

| Pattern | Description |
|---------|-------------|
| `users.get-profile` | Get user by ID |
| `users.update-profile` | Update user profile |
| `users.list` | List users with filters |
| `users.search` | Search users |

## Environment Variables

```env
NODE_ENV=development
USER_SERVICE_PORT=3004

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=coreTask

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USERS_QUEUE=users.queue
```

## Running

```bash
npm install
npm run start:dev
```

[← Back to Main README](../../README.md)
