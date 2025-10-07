/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskAssignmentResponseDto } from './TaskAssignmentResponseDto';
import type { UserInfoDto } from './UserInfoDto';
export type TaskResponseDto = {
    id: string;
    title: string;
    description?: Record<string, any>;
    dueDate?: Record<string, any>;
    priority: TaskResponseDto.priority;
    status: TaskResponseDto.status;
    createdBy: UserInfoDto;
    updatedBy?: UserInfoDto | null;
    completedAt?: Record<string, any>;
    meta?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    assignments: Array<TaskAssignmentResponseDto>;
};
export namespace TaskResponseDto {
    export enum priority {
        LOW = 'LOW',
        MEDIUM = 'MEDIUM',
        HIGH = 'HIGH',
        URGENT = 'URGENT',
    }
    export enum status {
        TODO = 'TODO',
        IN_PROGRESS = 'IN_PROGRESS',
        REVIEW = 'REVIEW',
        DONE = 'DONE',
    }
}

