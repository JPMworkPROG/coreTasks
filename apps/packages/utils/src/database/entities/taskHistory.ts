import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task';
import { User } from './authUser';

export enum TaskHistoryAction {
  Created = 'created',
  Updated = 'updated',
  StatusChanged = 'status_changed',
  Assigned = 'assigned',
  Unassigned = 'unassigned',
  Commented = 'commented',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Deleted = 'deleted'
}

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  taskId!: string;

  @Column({ type: 'enum', enum: TaskHistoryAction })
  action!: TaskHistoryAction;

  @Column({ type: 'uuid' })
  performedBy!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Task, (task) => task.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task!: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performedBy' })
  performedByUser!: User;
}
