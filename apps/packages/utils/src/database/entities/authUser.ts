import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   CreateDateColumn,
   UpdateDateColumn,
   Index,
   OneToMany,
} from 'typeorm';
import { TaskAssignment } from './taskAssignment';
import { Task } from './task';

@Entity('users')
export class User {
   @PrimaryGeneratedColumn('uuid')
   id!: string;

   @Column({ unique: true })
   @Index()
   email!: string;

   @Column()
   password!: string;

   @Column({ unique: true })
   @Index()
   username!: string;


   @Column({ default: true })
   isActive!: boolean;

   @CreateDateColumn()
   createdAt!: Date;

   @UpdateDateColumn()
   updatedAt!: Date;

   @Column({ nullable: true })
   lastLoginAt?: Date;

   @OneToMany(() => TaskAssignment, (assignment) => assignment.user)
   taskAssignments!: TaskAssignment[];

   @OneToMany(() => Task, (task) => task.createdByUser)
   createdTasks!: Task[];

   @OneToMany(() => Task, (task) => task.updatedByUser)
   updatedTasks!: Task[];
}
