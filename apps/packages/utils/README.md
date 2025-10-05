# @taskscore/utils

Pacote de utilitários compartilhados para os microsserviços do CoreTasks.

## Logger

Sistema de logging baseado em Pino com suporte a pino-pretty para desenvolvimento.

### Uso Básico

```typescript
import { logger } from '@taskscore/utils';

// Logs simples
logger.info('Serviço iniciado');
logger.error('Erro ao processar requisição');
logger.warn('Configuração não encontrada');

// Logs com contexto
logger.info('Usuário autenticado', { 
  userId: '123', 
  requestId: 'req-456' 
});
```

### Criando Logger Customizado

```typescript
import { createLogger } from '@taskscore/utils';

const customLogger = createLogger({
  level: 'debug',
  service: 'user-service',
  environment: 'production',
  pretty: false
});
```

### Logger Child

```typescript
import { logger } from '@taskscore/utils';

// Criar logger com contexto persistente
const requestLogger = logger.child({
  requestId: 'req-123',
  userId: 'user-456'
});

// Todos os logs subsequentes incluirão o contexto
requestLogger.info('Processando requisição');
requestLogger.error('Erro na validação');
```

### Variáveis de Ambiente

- `LOG_LEVEL`: Nível de log (fatal, error, warn, info, debug, trace)
- `SERVICE_NAME`: Nome do serviço
- `NODE_ENV`: Ambiente (development, production, test)

### Níveis de Log

- `fatal`: Erros críticos que fazem o serviço parar
- `error`: Erros que impedem operação específica
- `warn`: Avisos sobre situações anômalas
- `info`: Informações gerais de funcionamento
- `debug`: Informações detalhadas para depuração
- `trace`: Informações mais detalhadas que debug

### Formato de Saída

**Desenvolvimento**: Formato legível com cores (pino-pretty)
**Produção**: JSON estruturado para facilitar parsing
