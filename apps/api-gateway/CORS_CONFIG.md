# 🌐 Configuração de CORS - API Gateway

## 📋 Visão Geral

O API Gateway está configurado para aceitar requisições de **múltiplas origens** (aplicações web).

## ⚙️ Configuração

### Arquivo: `.env` ou `.env.local`

```env
# Múltiplas origens separadas por vírgula (sem espaços)
CORS_ORIGIN=http://localhost:8080,http://localhost:3001,http://localhost:5173

# Para desenvolvimento - permitir todas as origens
CORS_ORIGIN=*

# Para produção - listar todas as URLs específicas
CORS_ORIGIN=https://app1.example.com,https://app2.example.com,https://app3.example.com
```

## 🎯 Origens Padrão

Se `CORS_ORIGIN` não estiver definido, o sistema usa:

```javascript
[
  'http://localhost:8080',  // Frontend principal
  'http://localhost:3001',  // Frontend alternativo
  'http://localhost:5173',  // Vite dev server (padrão)
  'http://localhost:4173',  // Vite preview
]
```

## 📊 Configurações Aplicadas

| Opção | Valor | Descrição |
|-------|-------|-----------|
| **origin** | Dinâmico | Valida cada requisição |
| **credentials** | `true` | Permite cookies e auth headers |
| **methods** | GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD | Métodos HTTP permitidos |
| **allowedHeaders** | Content-Type, Authorization, X-Trace-Id, X-Requested-With | Headers aceitos |
| **exposedHeaders** | X-Trace-Id | Headers expostos ao cliente |
| **maxAge** | 86400s (24h) | Cache de preflight requests |

## 🔒 Segurança

### Desenvolvimento
```env
CORS_ORIGIN=http://localhost:8080,http://localhost:3001
```

### Produção
```env
# ✅ CORRETO - Listar todas as origens específicas
CORS_ORIGIN=https://app.mycompany.com,https://admin.mycompany.com,https://mobile.mycompany.com

# ❌ EVITE - Permitir todas as origens em produção
CORS_ORIGIN=*
```

## 🧪 Testar CORS

### 1. Verificar Headers na Response

```bash
curl -H "Origin: http://localhost:8080" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/tasks -v
```

**Resposta esperada:**
```
< Access-Control-Allow-Origin: http://localhost:8080
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD
< Access-Control-Max-Age: 86400
```

### 2. Logs do API Gateway

Ao iniciar, você verá:
```
[32mINFO[39m: CORS configured for multiple origins
origins: 4
allowed: [
  'http://localhost:8080',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:4173'
]
```

### 3. Origem Bloqueada

Se uma origem não permitida tentar acessar:
```
[33mWARN[39m: CORS blocked for origin
origin: "http://malicious-site.com"
allowed: ["http://localhost:8080", ...]
```

## 📱 Múltiplas Aplicações Web

### Exemplo: 3 Frontends

```env
CORS_ORIGIN=http://localhost:8080,https://web.myapp.com,https://admin.myapp.com
```

### Exemplo: Ambientes Diferentes

```env
# development.env
CORS_ORIGIN=http://localhost:8080,http://localhost:3001

# staging.env
CORS_ORIGIN=https://staging-app.mycompany.com

# production.env
CORS_ORIGIN=https://app.mycompany.com,https://admin.mycompany.com
```

## 🔧 Solução de Problemas

### CORS Error no Browser

**Erro:**
```
Access to fetch at 'http://localhost:3000/api/tasks' from origin 
'http://localhost:9000' has been blocked by CORS policy
```

**Solução:**
```env
# Adicionar a nova origem
CORS_ORIGIN=http://localhost:8080,http://localhost:9000
```

### Requisições sem Credentials

Se não precisar de cookies/auth:
```typescript
fetch('http://localhost:3000/api/tasks', {
  credentials: 'omit'  // ao invés de 'include'
})
```

### Wildcard em Desenvolvimento

Para facilitar desenvolvimento local:
```env
# development.env apenas!
CORS_ORIGIN=*
```

⚠️ **Nunca use `*` em produção!**

## 📝 Boas Práticas

1. ✅ Sempre liste origens específicas em produção
2. ✅ Use HTTPS em produção
3. ✅ Mantenha lista atualizada conforme novos apps são criados
4. ✅ Monitore logs de CORS bloqueado
5. ✅ Documente cada origem permitida

## 🎯 Implementação Atual

```typescript
// apps/api-gateway/src/main.ts
app.enableCors({
  origin: (origin, callback) => {
    // Validação dinâmica por requisição
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id', 'X-Requested-With'],
});
```

**Características:**
- ✅ Valida cada requisição individualmente
- ✅ Permite requisições sem origin (APIs/tools)
- ✅ Loga tentativas bloqueadas
- ✅ Suporta wildcard `*`
- ✅ Cache de preflight (24h)

## ✅ Status

CORS configurado e **pronto para múltiplas aplicações web**! 🚀

