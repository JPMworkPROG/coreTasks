/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginationMetaDto } from './PaginationMetaDto';
import type { TaskResponseDto } from './TaskResponseDto';
export type TaskListResponseDto = {
    data: Array<TaskResponseDto>;
    success: boolean;
    meta: PaginationMetaDto;
    message?: string;
    error?: string;
};

