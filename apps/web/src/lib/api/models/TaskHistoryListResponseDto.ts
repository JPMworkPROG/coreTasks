/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginationMetaDto } from './PaginationMetaDto';
import type { TaskHistoryEntryResponseDto } from './TaskHistoryEntryResponseDto';
export type TaskHistoryListResponseDto = {
    data: Array<TaskHistoryEntryResponseDto>;
    success: boolean;
    meta: PaginationMetaDto;
    message?: string;
    error?: string;
};

