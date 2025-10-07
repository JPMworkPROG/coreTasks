/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserInfoDto } from './UserInfoDto';
export type TaskHistoryEntryResponseDto = {
    id: string;
    taskId: string;
    action: Record<string, any>;
    performedBy: UserInfoDto;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: string;
};

