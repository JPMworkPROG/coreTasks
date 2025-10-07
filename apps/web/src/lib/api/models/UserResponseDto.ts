/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserResponseDto = {
    id: string;
    email: string;
    username: string;
    role: UserResponseDto.role;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: Record<string, any> | null;
};
export namespace UserResponseDto {
    export enum role {
        ADMIN = 'admin',
        USER = 'user',
    }
}

