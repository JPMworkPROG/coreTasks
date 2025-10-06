# Análise do API Gateway (NestJS)

## Contexto
- Revisão focada no serviço `apps/api-gateway`, abrangendo módulos HTTP, integrações com RabbitMQ e componentes cross-cutting (filtros, guards, interceptors).
- Objetivo: identificar inconsistências de arquitetura, más práticas de NodeJS/TypeScript/NestJS, despadronizações e pontos de falha/melhoria.

## Problemas críticos
- **Swagger UI não sobe** (`src/main.ts:83`): `SwaggerModule.setup` recebe a função `openApiDocument` em vez do objeto `OpenAPIObject`. Na inicialização o Nest tenta ler `document.paths`, resultando em `TypeError`. É preciso invocar a função (`openApiDocument()`) e tratar falhas antes de registrar a UI.
- **OpenAPI não é encontrada em produção** (`src/main.ts:49`): durante o build o código é transpilado para `dist/src`. O caminho relativo `../../documentation/api.openapi.yaml` passa a apontar para `dist/documentation`, inexistente por padrão. A aplicação derruba com `ENOENT`. Use `join(__dirname, '..', '..', '..', 'documentation', ...)` ou uma variável de ambiente configurável e valide a existência do arquivo.
- **Correlation ID inconsistente e ausente na autenticação** (`src/interceptors/correlationId.interceptor.ts:16`, `src/guards/strategies/jwt.strategy.ts:35`): o interceptor lê `request.headers.correlationId`, mas cabeçalhos HTTP chegam com `x-correlation-id`. Resultado: um novo UUID é sempre gerado e o ID enviado pelo cliente se perde. Além disso, interceptors executam após guards/strategies; portanto o `JwtStrategy` roda antes de o interceptor definir `req['correlationId']`, enviando `undefined` para os RPCs. O tracing entre gateway e serviços fica quebrado. Sugestão: mover a geração para um middleware (executa antes do Passport) e normalizar o cabeçalho `x-correlation-id`.
- **Fluxo de refresh token bloqueado** (`src/modules/auth/auth.controller.ts:89`): a rota `POST /api/auth/refresh` está protegida pelo `JwtAuthGuard`. Clientes precisam de um access token válido para renovar o access token, o que derrota o propósito do refresh (quando o access expira, a rota retorna 401). O correto é validar apenas o refresh token recebido (por body/cookie) e não exigir bearer token ativo.

## Problemas de severidade alta
- **Import ausente quebra o build** (`src/modules/auth/auth.controller.ts:37`): o controller tipa o parâmetro como `Request`, mas não importa `Request` de `express`. Com `lib` restrita a ES2021, o símbolo inexiste e o TypeScript falha ao compilar. Corrija adicionando `import { Request } from 'express';` como nos demais controllers.
- **Rate limiting configurado incorretamente** (`src/app.module.ts:24`): o `ThrottlerModule` espera `ttl` em segundos, mas o valor obtido da config é multiplicado por 1000. Um TTL de 60 segundos vira 60 000 s (~16h), tornando o rate limit ineficaz. Ajuste para passar o valor em segundos ou converta a fonte para milissegundos.
- **Valores obrigatórios da configuração podem virar `NaN`/`undefined`** (`config/envLoader.ts:36-37`, `src/app.module.ts:24-25`): `SERVER_RATE_LIMIT_TTL_SECONDS` e `SERVER_RATE_LIMIT_LIMIT` não são `required()`. Quando ausentes, `env-var` retorna `undefined`, gerando `NaN` na multiplicação ou limites indefinidos aplicados pelo throttler. Defina defaults sólidos ou marque esses parâmetros como obrigatórios.
- **URL do RabbitMQ opcional** (`config/envLoader.ts:47`): `RABBITMQ_URL` deveria ser obrigatório. Quando não informado, o array `urls` no `ClientProxyFactory` contém `undefined`, causando falha de conexão em runtime. Use `.required()` ou falhe rápido com mensagem clara.

## Problemas médios e oportunidades
- **Busca de fila duplicada e sem validação** (`src/modules/auth/auth.service.ts:37`): cada método lê `rabbitmq.queues.auth` do `ConfigService`. Diferente de `TaskService`/`UserService`, não há cache nem validação imediata; se a chave estiver errada o erro só aparece em runtime. Armazene o nome da fila no construtor (com verificação) para padronizar e detectar falhas mais cedo.
- **Retornos frouxos no guard/strategy** (`src/modules/auth/auth.service.ts:179`, `src/modules/auth/auth.controller.ts:169`): `AuthService.getUserById` retorna `Promise<any>` e o controller usa `req: any` em `getProfile`/`logout`. Isso propaga `any` e mascara problemas de contrato. Tipar com `UserResponseDto` e usar tipos compostos (`Request & { user: JwtPayload }`) daria segurança estática.
- **Dependência rígida do RabbitMQ na autenticação** (`src/guards/strategies/jwt.strategy.ts:42`): cada requisição autenticada faz uma chamada RPC síncrona ao serviço de auth. Se o broker estiver fora, todos os endpoints passam a responder `401`, mesmo com tokens válidos. Considere cache local do payload ou enriquecer o JWT com claims suficientes para validar sem round-trip obrigatório.
- **Logout sem implementação real** (`src/modules/auth/auth.controller.ts:189`): a rota responde sucesso, mas não emite nenhum comando para revogar/inativar refresh tokens. Ou implemente a chamada RPC (comentada) ou deixe claro que a operação é stateless.
- **Duplicação de lógica para extrair usuário** (`src/modules/task/task.controller.ts:45`, `src/modules/user/user.controller.ts:28`): ambos os controllers repetem `getActor`. Um decorator personalizado (`@AuthUser()`) ou injeção via interceptor evitaria duplicação e manteria logs/respostas consistentes.

## Despadronizações e ajustes recomendados
- `AuthModule`, `TaskModule` e `UserModule` cada um registram `PassportModule.register({ defaultStrategy: 'jwt' })`. Centralizar essa configuração (ou torná-la global) evita contradições e simplifica testes.
- Os logs de sucesso/erro RPC (`RabbitMQService` e services HTTP) são verbosos e repetitivos; extraia helpers ou use níveis (`debug` para chatter) para manter observabilidade sem ruído excessivo.
- `main.ts` ignora `ConfigService` já disponível para decidir a porta. Padronizar a leitura (`app.get(ConfigService).get('server.port')`) evita divergência entre config e variáveis de ambiente diretas.

## Pontos positivos
- Uso consistente de DTOs compartilhados (`@taskscore/types`) com validação e transformação automática graças ao `ValidationPipe` global (`src/main.ts:31`).
- Filtro global de Problem Details (`src/filters/problemDetails.filter.ts`) padroniza respostas de erro e mapeia exceções RPC para HTTP.
- `RabbitMQService` mantém conexões reutilizáveis por fila e fecha tudo em `onModuleDestroy`, reduzindo overhead e vazamentos.
