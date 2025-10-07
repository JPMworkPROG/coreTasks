/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponseDto } from '../models/AuthResponseDto';
import type { ForgotPasswordRequestDto } from '../models/ForgotPasswordRequestDto';
import type { ForgotPasswordResponseDto } from '../models/ForgotPasswordResponseDto';
import type { LoginRequestDto } from '../models/LoginRequestDto';
import type { RefreshTokenRequestDto } from '../models/RefreshTokenRequestDto';
import type { RegisterRequestDto } from '../models/RegisterRequestDto';
import type { ResetPasswordRequestDto } from '../models/ResetPasswordRequestDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Cadastrar um novo usuário
     * @returns AuthResponseDto Usuário criado com sucesso
     * @throws ApiError
     */
    public authControllerRegister({
        requestBody,
    }: {
        requestBody: RegisterRequestDto,
    }): CancelablePromise<AuthResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido`,
                409: `Email ou username já estão em uso`,
                500: `Erro inesperado no auth-service ou gateway`,
            },
        });
    }
    /**
     * Realizar login
     * @returns AuthResponseDto Login bem-sucedido
     * @throws ApiError
     */
    public authControllerLogin({
        requestBody,
    }: {
        requestBody: LoginRequestDto,
    }): CancelablePromise<AuthResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido`,
                401: `Credenciais inválidas`,
                500: `Erro inesperado no auth-service ou gateway`,
            },
        });
    }
    /**
     * Renovar tokens de acesso
     * @returns AuthResponseDto Tokens renovados com sucesso
     * @throws ApiError
     */
    public authControllerRefresh({
        requestBody,
    }: {
        requestBody: RefreshTokenRequestDto,
    }): CancelablePromise<AuthResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido`,
                401: `Refresh token inválido`,
                500: `Erro inesperado no auth-service ou gateway`,
            },
        });
    }
    /**
     * Solicitar recuperação de senha por email
     * @returns ForgotPasswordResponseDto Solicitação recebida. Token retornado apenas em ambiente controlado.
     * @throws ApiError
     */
    public authControllerForgotPassword({
        requestBody,
    }: {
        requestBody: ForgotPasswordRequestDto,
    }): CancelablePromise<ForgotPasswordResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/password/forgot',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido`,
            },
        });
    }
    /**
     * Atualizar a senha utilizando o token recebido
     * @returns void
     * @throws ApiError
     */
    public authControllerResetPassword({
        requestBody,
    }: {
        requestBody: ResetPasswordRequestDto,
    }): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/password/reset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido ou token expirado`,
            },
        });
    }
}
