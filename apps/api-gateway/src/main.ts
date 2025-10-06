import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { OpenAPIObject } from '@nestjs/swagger';
import { load } from 'js-yaml';
import { NestApplication } from '@nestjs/core';
import { TraceIdInterceptor } from './interceptors/traceId.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';
import { UncaughtErrorFilter } from './filters/uncaught-error.filter';
import { CustomValidationPipe } from './pipe/validation.pipe';
import { createLogger } from '@taskscore/utils';
import { resolve } from 'path';

let app: NestApplication;

const logger = createLogger({
  service: 'api-gateway',
  environment: process.env.NODE_ENV ?? 'development',
});

function loadOpenApiDocument(): OpenAPIObject {
  const specPath = resolve(process.cwd(), 'documentation', 'api.openapi.yaml');
  const raw = readFileSync(specPath, 'utf8');
  const parsed = load(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAPI specification could not be parsed as an object.');
  }

  const doc = parsed as OpenAPIObject;

  if (!doc.openapi || !doc.info || !doc.paths) {
    throw new Error('Invalid OpenAPI document: missing openapi/info/paths.');
  }

  return doc;
}
async function bootstrap() {
  logger.info('Starting API Gateway application');
  app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.useGlobalInterceptors(new TraceIdInterceptor());
  logger.info('Global interceptors configured');

  app.useGlobalFilters(
    new UncaughtErrorFilter(),
    new HttpExceptionFilter(),
    new RpcExceptionFilter(),
  );
  logger.info('Global filters configured');

  app.useGlobalPipes(new CustomValidationPipe());
  logger.info('Global pipes configured');

  const openApiDocument = loadOpenApiDocument();
  SwaggerModule.setup('api/docs', app, openApiDocument, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'CoreTasks API Gateway',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
  });
  logger.info('Swagger UI configured at /api/docs endpoint');

  const port = process.env.SERVER_PORT ?? 3000;
  await app.listen(port);
  logger.info('API Gateway started successfully', { port });
}

bootstrap()