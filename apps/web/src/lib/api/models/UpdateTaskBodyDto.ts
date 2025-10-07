/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateTaskBodyDto = {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: UpdateTaskBodyDto.priority;
    status?: UpdateTaskBodyDto.status;
    meta?: Record<string, any>;
};
export namespace UpdateTaskBodyDto {
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

