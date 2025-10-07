# Multi-stage build para API Gateway
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json (se existir) do workspace raiz
COPY package*.json ./
COPY apps/api-gateway/package*.json ./apps/api-gateway/

# Copiar pacotes locais necessários para o build
COPY apps/packages ./apps/packages

# Instalar dependências do workspace raiz (incluindo turbo para build)
RUN npm install

# Copiar código fonte do api-gateway
COPY apps/api-gateway ./apps/api-gateway/

# Build do projeto
WORKDIR /app/apps/api-gateway
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Instalar dumb-init para melhor gerenciamento de processos
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json do api-gateway
COPY apps/api-gateway/package*.json ./

# Copiar pacotes locais para node_modules ANTES da instalação
COPY --from=builder /app/apps/packages/tsconfig ./node_modules/@taskscore/tsconfig
COPY --from=builder /app/apps/packages/types ./node_modules/@taskscore/types
COPY --from=builder /app/apps/packages/utils ./node_modules/@taskscore/utils

# Instalar apenas dependências de produção
RUN npm install --only=production && npm cache clean --force

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/apps/api-gateway/dist ./dist

# Copiar arquivo de variáveis de ambiente
COPY --from=builder /app/apps/api-gateway/.env ./.env

# Copiar documentação necessária para a aplicação
COPY --from=builder /app/apps/api-gateway/documentation ./documentation

# Copiar arquivos de configuração necessários (se existirem)
# COPY --from=builder /app/apps/api-gateway/src/config ./src/config 2>/dev/null || true

# Alterar ownership dos arquivos para o usuário não-root
RUN chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta (definida no .env como SERVER_PORT)
EXPOSE 3000

# Definir variáveis de ambiente (NODE_ENV será sobrescrita pelo .env se necessário)
ENV NODE_ENV=production

# Usar dumb-init como entrypoint para melhor gerenciamento de sinais
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]
