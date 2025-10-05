import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCompleteDatabase1758800000000 implements MigrationInterface {
  name = 'InitCompleteDatabase1758800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar extensão UUID se não existir
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Criar tipos ENUM para tasks
    await queryRunner.query(
      "CREATE TYPE \"tasks_priority_enum\" AS ENUM('low','medium','high','critical')",
    );
    await queryRunner.query(
      "CREATE TYPE \"tasks_status_enum\" AS ENUM('todo','in_progress','in_review','done','cancelled')",
    );
    await queryRunner.query(
      "CREATE TYPE \"task_history_action_enum\" AS ENUM('created','updated','status_changed','assigned','unassigned','commented','completed','cancelled','deleted')",
    );

    // Criar tabela users
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "username" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )`,
    );

    // Criar índices para users
    await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username")`);

    // Criar tabela password_reset_tokens
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(128) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        "requestedBy" character varying(120),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Criar índices para password_reset_tokens
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_password_reset_tokens_token_hash" ON "password_reset_tokens" ("tokenHash")`);
    await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_user" ON "password_reset_tokens" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_expires" ON "password_reset_tokens" ("expiresAt")`);

    // Criar tabela tasks
    await queryRunner.query(
      `CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(180) NOT NULL,
        "description" text,
        "dueDate" TIMESTAMP WITH TIME ZONE,
        "priority" "tasks_priority_enum" NOT NULL DEFAULT 'medium',
        "status" "tasks_status_enum" NOT NULL DEFAULT 'todo',
        "createdBy" uuid NOT NULL,
        "updatedBy" uuid,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "meta" jsonb DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "version" integer NOT NULL DEFAULT 1,
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_created_by" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_updated_by" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL
      )`,
    );

    // Criar índices para tasks
    await queryRunner.query(`CREATE INDEX "IDX_tasks_title" ON "tasks" ("title")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")`);

    // Criar tabela task_assignments com relacionamento para users
    await queryRunner.query(
      `CREATE TABLE "task_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "assignedBy" uuid NOT NULL,
        "assignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_assignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_assignments_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_task_assignments_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_task_assignments_assigned_by" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );

    // Criar índices para task_assignments
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_task_assignment_unique" ON "task_assignments" ("taskId", "userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_assignment_task" ON "task_assignments" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_assignment_user" ON "task_assignments" ("userId")`);

    // Criar tabela task_comments
    await queryRunner.query(
      `CREATE TABLE "task_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "authorId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_comments_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_task_comments_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );

    // Criar índices para task_comments
    await queryRunner.query(`CREATE INDEX "IDX_task_comments_task" ON "task_comments" ("taskId")`);
    await queryRunner.query(`CREATE INDEX "IDX_task_comments_author" ON "task_comments" ("authorId")`);

    // Criar tabela task_history
    await queryRunner.query(
      `CREATE TABLE "task_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "taskId" uuid NOT NULL,
        "action" "task_history_action_enum" NOT NULL,
        "performedBy" uuid NOT NULL,
        "description" character varying(255),
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_task_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_history_task" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_task_history_performed_by" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE CASCADE
      )`,
    );

    // Criar índice para task_history
    await queryRunner.query(`CREATE INDEX "IDX_task_history_task" ON "task_history" ("taskId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropar índices e tabelas na ordem inversa
    await queryRunner.query(`DROP INDEX "public"."IDX_task_history_task"`);
    await queryRunner.query(`DROP TABLE "task_history"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_task_comments_author"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_comments_task"`);
    await queryRunner.query(`DROP TABLE "task_comments"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_task_assignment_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_assignment_task"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_task_assignment_unique"`);
    await queryRunner.query(`DROP TABLE "task_assignments"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tasks_title"`);
    await queryRunner.query(`DROP TABLE "tasks"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_expires"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_password_reset_tokens_token_hash"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Dropar tipos ENUM
    await queryRunner.query(`DROP TYPE "task_history_action_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_priority_enum"`);
  }
}
