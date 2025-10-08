/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskAssignmentResponseDto } from './TaskAssignmentResponseDto';
import type { UserInfoDto } from './UserInfoDto';
export type TaskDetailsResponseDto = {
    id: string;
    title: string;
    description?: Record<string, any>;
    dueDate?: Record<string, any>;
    priority: TaskDetailsResponseDto.priority;
    status: TaskDetailsResponseDto.status;
    createdBy: UserInfoDto;
    updatedBy?: UserInfoDto | null;
    completedAt?: Record<string, any>;
    meta?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    assignments: Array<TaskAssignmentResponseDto>;
};
export namespace TaskDetailsResponseDto {
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
        CANCELLED = 'CANCELLED',
    }
}

