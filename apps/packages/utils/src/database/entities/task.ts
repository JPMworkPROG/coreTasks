import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { TaskAssignment } from './taskAssignment';
import { TaskComment } from './taskComment';
import { TaskHistory } from './taskHistory';
import { User } from './authUser';

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  InReview = 'in_review',
  Done = 'done',
  Cancelled = 'cancelled'
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  @Index()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate?: Date | null;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.Medium })
  priority!: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Todo })
  @Index()
  status!: TaskStatus;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @VersionColumn()
  version!: number;

  @OneToMany(() => TaskAssignment, (assignment) => assignment.task, { cascade: true })
  assignments!: TaskAssignment[];

  @OneToMany(() => TaskComment, (comment) => comment.task, { cascade: true })
  comments!: TaskComment[];

  @OneToMany(() => TaskHistory, (history) => history.task, { cascade: true })
  history!: TaskHistory[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  createdByUser!: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser?: User | null;
}
