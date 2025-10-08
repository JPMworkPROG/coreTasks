/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserListResponseDto } from '../models/UserListResponseDto';
import type { UserResponseDto } from '../models/UserResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UsersService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Obter informações do usuário logado
     * @returns UserResponseDto Informações do usuário retornadas com sucesso
     * @throws ApiError
     */
    public usersControllerGetMe(): CancelablePromise<UserResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/users/me',
            errors: {
                401: `Não autenticado`,
                500: `Erro inesperado no user-service ou gateway`,
            },
        });
    }
    /**
     * Listar usuários com paginação
     * @returns UserListResponseDto
     * @throws ApiError
     */
    public usersControllerListUsers({
        page,
        limit,
        userName,
    }: {
        page?: number,
        limit?: number,
        userName?: string,
    }): CancelablePromise<UserListResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/users',
            query: {
                'page': page,
                'limit': limit,
                'userName': userName,
            },
            errors: {
                400: `Parâmetros inválidos`,
                401: `Não autenticado`,
            },
        });
    }
}
