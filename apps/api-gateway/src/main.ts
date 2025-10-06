import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { OpenAPIObject } from '@nestjs/swagger';
import { load } from 'js-yaml';
import { NestApplication } from '@nestjs/core';
import { CorrelationIdInterceptor } from './interceptors/correlationId.interceptor';
import { ProblemDetailsFilter } from './filters/problemDetails.filter';
import { CustomValidationPipe } from './pipe/validation.pipe';
import { createLogger } from '@taskscore/utils';

let app: NestApplication;

const logger = createLogger({
  service: 'api-gateway',
  environment: process.env.NODE_ENV ?? 'development',
});

async function bootstrap() {
  logger.info('Starting API Gateway application...');
  app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  logger.info('Global interceptors configured...');

  app.useGlobalFilters(new ProblemDetailsFilter());
  logger.info('Global filters configured...');

  app.useGlobalPipes(new CustomValidationPipe());
  logger.info('Global pipes configured...');

  const openApiDocument = () => {
    try {
      logger.info('Loading OpenAPI documentation...');
      const rawYaml = readFileSync('../../documentation/api.openapi.yaml', 'utf8');
      const document = load(rawYaml);

      if (!document || typeof document !== 'object') {
        logger.error('OpenAPI specification could not be parsed as an object');
        throw new Error('OpenAPI specification could not be parsed as an object.');
      }

      // Garantir que temos as propriedades mínimas necessárias
      const openApiDoc = {
        openapi: document.openapi || '3.0.0',
        info: document.info || {
          title: 'API Gateway',
          version: '1.0.0',
          description: 'API Gateway Documentation'
        },
        paths: document.paths || {},
        components: document.components || {},
        ...document
      };

      logger.info('OpenAPI documentation loaded successfully', {
        version: openApiDoc.openapi,
        title: openApiDoc.info.title
      });
      return openApiDoc as OpenAPIObject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load OpenAPI documentation', { error: errorMessage });
      throw error;
    }
  };

  // Configurar Swagger UI no endpoint /openapi
  SwaggerModule.setup('api/docs', app, openApiDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'CoreTasks API Gateway',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
  });
  logger.info('Swagger UI configured at /api/docs endpoint');

const port = process.env.SERVER_PORT ?? 3000;
await app.listen(port);
 
logger.info('API Gateway started successfully', {
  port,
  swaggerUrl: `http://localhost:${port}/api/docs`
});
}

bootstrap()

