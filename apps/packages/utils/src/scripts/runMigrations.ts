#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import env from 'env-var';
import { createLogger } from '../logger';
import { User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory } from '../database/entities';
import * as migrations from '../database/migrations';

config();

const logger = createLogger({
  service: 'migration-runner',
  level: (env.get('LOG_LEVEL').asString() as any) || 'info',
  environment: env.get('NODE_ENV').asString() || 'development',
});

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: env.get('DB_HOST').default('localhost').asString(),
    port: env.get('DB_PORT').default(5432).asPortNumber(),
    username: env.get('DB_USERNAME').required().asString(),
    password: env.get('DB_PASSWORD').required().asString(),
    database: env.get('DB_NAME').required().asString(),
    ssl: env.get('DB_SSL').default('false').asBoolStrict(),
    logging: env.get('DB_LOGGING').default('true').asBoolStrict(),
    synchronize: false,
    entities: [User, PasswordResetToken, Task, TaskAssignment, TaskComment, TaskHistory],
    migrations: Object.values(migrations),
    migrationsRun: false,
  });

  try {
    logger.info('Initializing database connection...');
    await dataSource.initialize();

    logger.info('Running pending migrations...');
    const pendingMigrations = await dataSource.showMigrations();
    
    if (!pendingMigrations) {
      logger.info('No pending migrations found');
      return;
    }

    await dataSource.runMigrations();
    logger.info('Migrations completed successfully');
    
    const executedMigrations = await dataSource.query(
      'SELECT * FROM migrations ORDER BY timestamp DESC'
    );
    
    logger.info('Executed migrations:', {
      count: executedMigrations.length,
      migrations: executedMigrations.map((m: any) => m.name)
    });

  } catch (error) {
    logger.error('Migration failed:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      logger.info('Database connection closed');
    }
  }
}

if (require.main === module) {
  runMigrations().catch((error) => {
    logger.error('Unhandled error:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  });
}

export { runMigrations };
