/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuthUserDto = {
    id: string;
    email: string;
    username: string;
    role: AuthUserDto.role;
};
export namespace AuthUserDto {
    export enum role {
        USER = 'user',
        ADMIN = 'admin',
    }
}

