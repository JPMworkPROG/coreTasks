# Auth Service

> Microservice responsible for authentication and authorization

**Port**: `3002` | **Protocol**: RabbitMQ RPC | **Database**: PostgreSQL (shared)

## Overview

The Auth Service handles user authentication, JWT token generation/validation, password management, and refresh token logic.

## Features

- ✅ User registration
- ✅ Login with JWT (Access + Refresh tokens)
- ✅ Token refresh
- ✅ Logout
- ✅ Password reset flow
- ✅ Email verification (planned)

## RPC Endpoints

| Pattern | Description |
|---------|-------------|
| `auth.register` | Register new user |
| `auth.login` | Login user |
| `auth.refresh-token` | Refresh access token |
| `auth.logout` | Logout user |
| `auth.forgot-password` | Request password reset |
| `auth.reset-password` | Reset password with token |
| `auth.validate-token` | Validate JWT token |

## JWT Strategy

- **Access Token**: 15 minutes (short-lived)
- **Refresh Token**: 7 days (long-lived)
- Algorithm: HS256
- Payload: `{ id, email, username, iat, exp }`

## Environment Variables

```env
NODE_ENV=development
AUTH_SERVICE_PORT=3002

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=coreTask

RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_AUTH_QUEUE=auth.queue

JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10
```

## Running

```bash
npm install
npm run start:dev
```

[← Back to Main README](../../README.md)
