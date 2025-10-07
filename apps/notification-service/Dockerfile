FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY apps/notification-service/package*.json ./apps/notification-service/
COPY apps/packages/types/package*.json ./apps/packages/types/
COPY apps/packages/utils/package*.json ./apps/packages/utils/
COPY apps/packages/tsconfig/package*.json ./apps/packages/tsconfig/

# Install dependencies
RUN npm ci --workspace=notification-service

# Copy source code
COPY apps/notification-service ./apps/notification-service
COPY apps/packages ./apps/packages

# Build
RUN npm run build --workspace=notification-service

FROM node:20-alpine AS runtime

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/notification-service/dist ./dist
COPY --from=builder /app/apps/notification-service/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3003

CMD ["node", "dist/main.js"]

