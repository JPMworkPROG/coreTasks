/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginationMetaDto } from './PaginationMetaDto';
import type { TaskCommentResponseDto } from './TaskCommentResponseDto';
export type CommentListResponseDto = {
    data: Array<TaskCommentResponseDto>;
    success: boolean;
    meta: PaginationMetaDto;
    message?: string;
    error?: string;
};

