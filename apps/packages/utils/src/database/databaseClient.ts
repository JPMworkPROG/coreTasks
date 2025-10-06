import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import env from 'env-var';
import { createLogger } from '../logger';
import * as entities from './entities';
import * as migrations from './migrations';

config();

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  logging?: boolean;
  synchronize?: boolean;
}

class DatabaseClient {
  private dataSource: DataSource | null = null;
  private config: DatabaseConfig;
  private logger;

  constructor() {
    this.config = this.loadDatabaseConfig();
    this.logger = createLogger({
      service: 'database-client',
      level: (env.get('LOG_LEVEL').asString() as any) || 'info',
      environment: env.get('NODE_ENV').asString() || 'development',
    });
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      host: env.get('DB_HOST').default('localhost').asString(),
      port: env.get('DB_PORT').default(5432).asPortNumber(),
      username: env.get('DB_USERNAME').required().asString(),
      password: env.get('DB_PASSWORD').required().asString(),
      database: env.get('DB_NAME').required().asString(),
      ssl: env.get('DB_SSL').default('false').asBoolStrict(),
      logging: env.get('DB_LOGGING').default('false').asBoolStrict(),
      synchronize: env.get('DB_SYNCHRONIZE').default('false').asBoolStrict(),
    };
  }

  private createDataSourceOptions(): DataSourceOptions {
    return {
      type: 'postgres',
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      database: this.config.database,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      logging: this.config.logging,
      synchronize: this.config.synchronize,
      entities: [
        entities.User,
        entities.PasswordResetToken,
        entities.Task,
        entities.TaskAssignment,
        entities.TaskComment,
        entities.TaskHistory
      ],
      migrations: Object.values(migrations),
      extra: {
        max: 20, // Máximo de conexões no pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    };
  }

  async connect(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      this.logger.info('Database connection already established');
      return this.dataSource;
    }

    try {
      this.logger.info('Initializing database connection', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        ssl: this.config.ssl
      });

      const dataSourceOptions = this.createDataSourceOptions();
      this.dataSource = new DataSource(dataSourceOptions);

      await this.dataSource.initialize();
      
      this.logger.info('Database connection established successfully', {
        entitiesCount: this.dataSource.entityMetadatas.length,
        migrationsCount: this.dataSource.migrations.length
      });
      return this.dataSource;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to connect to database', { 
        error: errorMessage,
        host: this.config.host,
        port: this.config.port,
        database: this.config.database
      });
      throw new Error(`Database connection failed: ${errorMessage}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      try {
        this.logger.info('Closing database connection...');
        await this.dataSource.destroy();
        this.dataSource = null;
        this.logger.info('Database connection closed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Error closing database connection', { error: errorMessage });
        throw error;
      }
    } else {
      this.logger.warn('No active database connection to close');
    }
  }

  getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.dataSource;
  }

  isConnected(): boolean {
    return this.dataSource?.isInitialized ?? false;
  }
}


export function createDatabaseClient(): DatabaseClient {
  return new DatabaseClient();
}

export { DatabaseClient };
export default DatabaseClient;
