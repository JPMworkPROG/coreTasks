# Configuração Docker - CoreTasks

## Visão Geral

Este documento descreve a arquitetura Docker do projeto CoreTasks, incluindo instruções para executar múltiplas instâncias da aplicação web para testar notificações em tempo real.

## Arquitetura

O projeto é composto pelos seguintes serviços:

### Backend Services
- **api-gateway** (porta 3000) - Gateway principal da API
- **auth-service** (porta 3002) - Serviço de autenticação
- **task-service** (porta 3001) - Serviço de gerenciamento de tarefas
- **user-service** (porta 3004) - Serviço de gerenciamento de usuários
- **notification-service** (porta 3003) - Serviço de notificações em tempo real (WebSocket)

### Frontend Applications
- **web-1** (porta 8080) - Instância 1 da aplicação web
- **web-2** (porta 8081) - Instância 2 da aplicação web

### Infrastructure
- **db** (porta 5432) - PostgreSQL 17.5
- **rabbitmq** (porta 5672, management 15672) - RabbitMQ para mensageria

## Como Executar

### Subir todos os serviços

```bash
docker-compose up --build
```

### Subir serviços específicos

```bash
# Apenas backend
docker-compose up --build api-gateway auth-service task-service user-service notification-service db rabbitmq

# Apenas uma instância web
docker-compose up --build web-1

# Ambas instâncias web
docker-compose up --build web-1 web-2
```

### Rebuild de serviços específicos

```bash
# Rebuild do notification-service
docker-compose build notification-service
docker-compose up notification-service

# Rebuild das aplicações web
docker-compose build web-1 web-2
docker-compose up web-1 web-2
```

## Testando Notificações em Tempo Real

Para validar o comportamento de notificações em tempo real entre diferentes clientes:

1. **Inicie todos os serviços:**
   ```bash
   docker-compose up --build
   ```

2. **Acesse as duas instâncias da aplicação web:**
   - Cliente 1: http://localhost:8080
   - Cliente 2: http://localhost:8081

3. **Cenários de teste:**
   - Faça login no Cliente 1 e Cliente 2 com usuários diferentes
   - Crie, edite ou delete uma tarefa em um cliente
   - Observe as notificações em tempo real no outro cliente
   - Teste comentários, atribuições e mudanças de status

4. **Monitorar WebSocket:**
   - As duas instâncias web se conectam ao mesmo `notification-service` (porta 3003)
   - Abra o DevTools do navegador para ver as conexões WebSocket
   - Observe os eventos sendo transmitidos em tempo real

## Variáveis de Ambiente

### Backend Services
Todas as configurações de banco de dados e RabbitMQ são gerenciadas via variáveis de ambiente no `docker-compose.yml`:

- `NODE_ENV=production`
- `DB_HOST=db`
- `RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672`

### Frontend Applications
As aplicações web são configuradas via build arguments:

- `VITE_API_BASE_URL` - URL do API Gateway (http://localhost:3000)
- `VITE_WEBSOCKET_URL` - URL do Notification Service (http://localhost:3003)
- `VITE_APP_NAME` - Nome diferenciado para cada instância (Client 1 / Client 2)

## Estrutura de Rede

Todos os serviços estão na mesma rede Docker (`challenge-network`), permitindo comunicação interna entre containers usando os nomes dos serviços.

## Volumes Persistentes

- `postgres_data` - Dados do PostgreSQL
- `rabbitmq_data` - Dados do RabbitMQ

## Healthchecks

Os seguintes serviços possuem healthchecks configurados:

- **PostgreSQL**: Verifica conexão com `pg_isready`
- **RabbitMQ**: Verifica conectividade de portas e virtual hosts
- **Web Applications**: Verifica se o nginx está respondendo

## Troubleshooting

### Erro: "Cannot find module '@taskscore/types'"
Certifique-se de que os Dockerfiles estão copiando corretamente os pacotes locais do workspace.

### Erro: "target stage 'production' could not be found"
Verifique se todos os Dockerfiles possuem o stage `production` definido.

### WebSocket não conecta
- Verifique se o `notification-service` está rodando na porta 3003
- Confirme que a variável `VITE_WEBSOCKET_URL` está configurada corretamente
- Verifique logs do container: `docker logs notification-service`

### Rebuild completo (limpar cache)
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Logs e Debugging

```bash
# Ver logs de um serviço específico
docker logs -f notification-service

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs apenas das aplicações web
docker-compose logs -f web-1 web-2
```

## Acesso aos Serviços

- **API Gateway**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **PostgreSQL**: localhost:5432 (postgres/password)
- **Web App 1**: http://localhost:8080
- **Web App 2**: http://localhost:8081
- **Notification Service**: ws://localhost:3003

