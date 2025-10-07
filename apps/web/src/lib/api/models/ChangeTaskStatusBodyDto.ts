/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChangeTaskStatusBodyDto = {
    status: ChangeTaskStatusBodyDto.status;
    reason?: string;
};
export namespace ChangeTaskStatusBodyDto {
    export enum status {
        TODO = 'TODO',
        IN_PROGRESS = 'IN_PROGRESS',
        REVIEW = 'REVIEW',
        DONE = 'DONE',
    }
}

