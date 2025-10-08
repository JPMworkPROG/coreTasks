# Desafio Full-stack Júnior — Sistema de Gestão de Tarefas Colaborativo

Bem‑vindo(a)! Este é um **teste prático** para a vaga de **Full‑stack Developer Júnior** na **Jungle Gaming**. O objetivo é avaliar sua capacidade de estruturar um monorepo, modelar um domínio simples, construir uma UI funcional e integrar serviços usando mensageria.

> **Stack Obrigatória**
>
> * **Front‑end:** React.js + **TanStack Router**, **shadcn/ui**, **Tailwind CSS**
> * **Back‑end:** **Nest.js**, **TypeORM**, **RabbitMQ** (microservices Nest)
> * **Infra/DevX:** **Docker & docker‑compose**, **Monorepo com Turborepo**

---

## 🎯 Contexto & Objetivo

Construir um **Sistema de Gestão de Tarefas Colaborativo** com autenticação simples, CRUD de tarefas, comentários, atribuição e notificações. O sistema deve rodar em **monorepo** e expor uma **UI** limpa, responsiva e usável. O back‑end deve ser composto por **microserviços Nest** que se comunicam via **RabbitMQ**; o acesso HTTP externo passa por um **API Gateway** (Nest HTTP).

**O que queremos observar:**

* Organização, clareza e pragmatismo.
* Segurança básica (hash de senha, validação de entrada).
* Divisão de responsabilidades entre serviços.
* Qualidade da UI e DX (developer experience).

---

## 🧱 Requisitos Funcionais

### Autenticação & Gateway

* **JWT** com **cadastro/login** (email, username, password) e **proteção de rotas no API Gateway**.
* **Hash de senha** com **bcrypt** (ou argon2).
* **Tokens:** `accessToken` (15 min) e `refreshToken` (7 dias) + **endpoint de refresh**.
* **Swagger/OpenAPI** exposto no Gateway.

### Tarefas (inclui comentários e histórico)

* **CRUD completo** com campos: **título**, **descrição**, **prazo**, **prioridade** (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) e **status** (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`).
* **Atribuição a múltiplos usuários**.
* **Comentários**: criar e listar em cada tarefa.
* **Histórico de alterações** (audit log simplificado).

### Notificações & Tempo Real

* Ao **criar/atualizar/comentar** uma tarefa, **publicar evento** no broker (**RabbitMQ**).
* Serviço de **notifications** consome da fila, **persiste** e **entrega via WebSocket**.
* WebSocket notifica quando:

  * a tarefa é **atribuída** ao usuário;
  * o **status** da tarefa muda;
  * há **novo comentário** em tarefa da qual participa.

### Docker

* **Obrigatório subir tudo com Docker Compose** (serviços do app, broker, dbs, etc.).


## ⚡ HTTP Endpoints & WebSocket Events

### HTTP (Gateway)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

GET    /api/tasks?page=&size=               # lista de tarefas com paginação
POST   /api/tasks                           # cria e publica `task.created`
GET    /api/tasks/:id
PUT    /api/tasks/:id                       # atualiza e publica `task.updated`
DELETE /api/tasks/:id

POST   /api/tasks/:id/comments              # publica `task.comment.created`
GET    /api/tasks/:id/comments?page=&size   # lista de comentários com paginação
```

### WebSocket Events

* `task:created` – tarefa foi criada
* `task:updated` – tarefa foi atualizada
* `comment:new` – novo comentário

---

## 🏗️ Estrutura do Monorepo (sugerida)

```
.
├── apps/
│   ├── web/                     
│   │   ├── src/                  # React + TanStack Router + shadcn + Tailwind
│   │   ├── Dockerfile   
│   │   ├── .env.example          # variáveis de ambiente do frontend
│   │   ├── package.json              
│   ├── api-gateway/   
│   │   ├── src/                  # HTTP + WebSocket + Swagger
│   │   ├── Dockerfile
│   │   ├── .env.example          # variáveis do API Gateway (Nest.js)
│   │   ├── package.json
│   ├── auth-service/            
│   │   ├── src/                  # Nest.js (microserviço de autenticação)
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   ├── .env.example          # variáveis do serviço de autenticação
│   │   ├── package.json
│   ├── tasks-service/   
│   │   ├── src/                  # Nest.js (microserviço RabbitMQ)
│   │   ├── migrations/
│   │   ├── Dockerfile        
│   │   ├── .env.example          # variáveis do serviço de tarefas
│   │   ├── package.json
│   └── notifications-service/   
│       ├── src/                  # Nest.js (microserviço RabbitMQ + WebSocket)
│       ├── migrations/
│       ├── Dockerfile
│       ├── .env.example          # variáveis do serviço de notificações
│       ├── package.json                
├── packages/
│   ├── types/                   
│   ├── utils/                   
│   ├── eslint-config/           
│   └── tsconfig/                
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

---

## 🧭 Front-end (exigências)

* **React.js** com **TanStack Router**.
* **UI:** mínimo 5 componentes com **shadcn/ui** + **Tailwind CSS**.
* **Páginas obrigatórias:**
  * Login/Register com validação (Pode ser um modal)
  * Lista de tarefas com filtros e busca
  * Detalhe da tarefa com comentários
* **Estado:** Context API ou Zustand para auth.
* **WebSocket:** conexão para notificações em tempo real.
* **Validação:** `react-hook-form` + `zod`.
* **Loading/Error:** Skeleton loaders (shimmer effect) e toast notifications.

> **Diferencial:** TanStack Query.

---

## 🛠️ Back-end (exigências)

* **Nest.js** com **TypeORM** (PostgreSQL).
* **JWT** com Guards e estratégias Passport.
* **Swagger** completo no Gateway (`/api/docs`).
* **DTOs** com `class-validator` e `class-transformer`.
* **Microserviços** Nest.js com **RabbitMQ**.
* **WebSocket** Gateway para eventos real-time.
* **Migrations** com TypeORM.
* **Rate limiting** no API Gateway (10 req/seg).

> **Diferencial:** health checks, Logging com Winston ou Pino, testes unitários.

---

## 🐳 Docker & Compose (sugerido)

```yaml
version: '3.8'

services:
  # Frontend React Application
  web:
    container_name: web
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      target: development
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
    networks:
      - challenge-network
    command: npm run dev -- --host 0.0.0.0

  # API Gateway
  api-gateway:
    container_name: api-gateway
    build:
      context: .
      dockerfile: ./apps/api-gateway/Dockerfile
      target: development
    ports:
      - '3001:3001'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/api-gateway/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3001
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Auth Service
  auth-service:
    container_name: auth-service
    build:
      context: .
      dockerfile: ./apps/auth-service/Dockerfile
      target: development
    ports:
      - '3002:3002'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/auth-service/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3002
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Tasks Service
  tasks-service:
    container_name: tasks-service
    build:
      context: .
      dockerfile: ./apps/tasks-service/Dockerfile
      target: development
    ports:
      - '3003:3003'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/tasks-service/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3003
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Notifications Service
  notifications-service:
    container_name: notifications-service
    build:
      context: .
      dockerfile: ./apps/notifications-service/Dockerfile
      target: development
    ports:
      - '3004:3004'
    volumes:
      - .:/app
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/notifications-service/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3004
    depends_on:
      db:
        condition: service_started
      rabbitmq:
        condition: service_started
    networks:
      - challenge-network

  # Postgres Database
  db:
    image: postgres:17.5-alpine3.21
    container_name: db
    attach: false
    ports:
      - '5432:5432'
    networks:
      - challenge-network
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_USER: postgres
      POSTGRES_DB: challenge_db

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: rabbitmq
    attach: false
    restart: always
    ports:
      - '5672:5672'
      - '15672:15672'
    networks:
      - challenge-network
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes: ['rabbitmq_data:/var/lib/rabbitmq']

volumes:
  postgres_data:
    driver: local
  rabbitmq_data:
    driver: local

networks:
  challenge-network:
    driver: bridge
```

---

## 📝 Documentação Esperada

No seu README, inclua:

1. **Arquitetura** (diagrama simples ASCII ou imagem)
2. **Decisões técnicas** e trade-offs
3. **Problemas conhecidos** e o que melhoraria
4. **Tempo gasto** em cada parte
5. **Instruções específicas** se houver

---

## 📚 Material de Referência

Para auxiliar no desenvolvimento deste desafio, disponibilizamos alguns conteúdos que podem ser úteis:

### Vídeos Recomendados

* **[Autenticação centralizada em microsserviços NestJS](https://www.youtube.com/watch?v=iiSTB0btEgA)** - Como implementar autenticação centralizada em uma arquitetura de microsserviços usando NestJS.
* **[Tutorial de Microservices com Nest.js em 20 Minutos](https://www.youtube.com/watch?v=C250DCwS81Q)** - Passo a passo rápido para criar e conectar microsserviços no NestJS.

Estes materiais são sugestões para apoiar seu desenvolvimento, mas sinta-se livre para buscar outras referências que julgar necessárias.

---

## ❓ FAQ

**Posso usar NextJS ao invés de React puro?**
Não. React com TanStack Router é obrigatório.

**Preciso implementar reset de senha?**
Não é obrigatório, mas seria um diferencial.

**WebSocket é obrigatório?**
Sim, para notificações em tempo real.

**Posso usar Prisma ou MikroORM ao invés de TypeORM?**
Não. TypeORM é requisito obrigatório.

---

## 📧 Suporte e Dúvidas

Caso tenha alguma dúvida sobre o teste ou precise de esclarecimentos:

* Entre em contato com o **recrutador que enviou este teste**
* Ou envie um e-mail para: **recruitment@junglegaming.io**

Responderemos o mais breve possível para garantir que você tenha todas as informações necessárias para realizar o desafio.

---

## 🕒 Prazo

* **Entrega:** 14 dias corridos a partir do recebimento

---

## 💡 Dicas Finais

* **Comece pelo básico:** Auth → CRUD → RabbitMQ → WebSocket.
* **Logs claros:** Facilita debug do fluxo assíncrono.

---

**Boa sorte!** 🚀