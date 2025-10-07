/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignUsersBodyDto } from '../models/AssignUsersBodyDto';
import type { ChangeTaskStatusBodyDto } from '../models/ChangeTaskStatusBodyDto';
import type { CommentListResponseDto } from '../models/CommentListResponseDto';
import type { CreateCommentBodyDto } from '../models/CreateCommentBodyDto';
import type { CreateTaskBodyDto } from '../models/CreateTaskBodyDto';
import type { TaskDetailsResponseDto } from '../models/TaskDetailsResponseDto';
import type { TaskHistoryListResponseDto } from '../models/TaskHistoryListResponseDto';
import type { TaskListResponseDto } from '../models/TaskListResponseDto';
import type { TaskResponseDto } from '../models/TaskResponseDto';
import type { UpdateTaskBodyDto } from '../models/UpdateTaskBodyDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class TasksService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Criar uma nova tarefa
     * @returns TaskResponseDto Tarefa criada com sucesso
     * @throws ApiError
     */
    public tasksControllerCreateTask({
        requestBody,
    }: {
        requestBody: CreateTaskBodyDto,
    }): CancelablePromise<TaskResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/tasks',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido`,
                401: `Não autenticado`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Listar tarefas com filtros e paginação
     * @returns TaskListResponseDto Lista de tarefas retornada com sucesso
     * @throws ApiError
     */
    public tasksControllerListTasks({
        page,
        limit,
        status,
        priority,
        search,
        assignedTo,
    }: {
        page?: number,
        limit?: number,
        status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        search?: string,
        /**
         * Filtrar por atribuição
         */
        assignedTo?: string,
    }): CancelablePromise<TaskListResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/tasks',
            query: {
                'page': page,
                'limit': limit,
                'status': status,
                'priority': priority,
                'search': search,
                'assignedTo': assignedTo,
            },
            errors: {
                400: `Parâmetros de consulta inválidos`,
                401: `Não autenticado`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Consultar detalhes de uma tarefa
     * @returns TaskDetailsResponseDto Detalhes da tarefa retornados com sucesso
     * @throws ApiError
     */
    public tasksControllerGetTask({
        id,
    }: {
        id: string,
    }): CancelablePromise<TaskDetailsResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `ID da tarefa inválido`,
                401: `Não autenticado`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Atualizar uma tarefa existente
     * @returns TaskResponseDto Tarefa atualizada com sucesso
     * @throws ApiError
     */
    public tasksControllerUpdateTask({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateTaskBodyDto,
    }): CancelablePromise<TaskResponseDto> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido ou ID da tarefa inválido`,
                401: `Não autenticado`,
                403: `Sem permissão para atualizar a tarefa`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Remover uma tarefa
     * @returns void
     * @throws ApiError
     */
    public tasksControllerDeleteTask({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `ID da tarefa inválido`,
                401: `Não autenticado`,
                403: `Sem permissão para remover a tarefa`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Adicionar um comentário à tarefa
     * @returns TaskDetailsResponseDto Comentário adicionado com sucesso
     * @throws ApiError
     */
    public tasksControllerCreateComment({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: CreateCommentBodyDto,
    }): CancelablePromise<TaskDetailsResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/tasks/{id}/comments',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido ou ID da tarefa inválido`,
                401: `Não autenticado`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Listar comentários da tarefa
     * @returns CommentListResponseDto Lista de comentários retornada com sucesso
     * @throws ApiError
     */
    public tasksControllerListComments({
        id,
        page,
        limit,
    }: {
        id: string,
        page?: number,
        limit?: number,
    }): CancelablePromise<CommentListResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/tasks/{id}/comments',
            path: {
                'id': id,
            },
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                400: `Parâmetros inválidos ou ID da tarefa inválido`,
                401: `Não autenticado`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Atribuir usuários à tarefa
     * @returns TaskResponseDto Usuários atribuídos à tarefa com sucesso
     * @throws ApiError
     */
    public tasksControllerAssignUsers({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: AssignUsersBodyDto,
    }): CancelablePromise<TaskResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/tasks/{id}/assign',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido ou ID da tarefa inválido`,
                401: `Não autenticado`,
                403: `Sem permissão para atribuir usuários à tarefa`,
                404: `Tarefa ou usuários não encontrados`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Alterar status da tarefa
     * @returns TaskResponseDto Status da tarefa alterado com sucesso
     * @throws ApiError
     */
    public tasksControllerChangeStatus({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ChangeTaskStatusBodyDto,
    }): CancelablePromise<TaskResponseDto> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/tasks/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Payload inválido ou ID da tarefa inválido`,
                401: `Não autenticado`,
                403: `Sem permissão para alterar o status da tarefa`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
    /**
     * Consultar histórico de alterações da tarefa
     * @returns TaskHistoryListResponseDto Histórico de alterações da tarefa retornado com sucesso
     * @throws ApiError
     */
    public tasksControllerListHistory({
        id,
        page,
        limit,
    }: {
        id: string,
        page?: number,
        limit?: number,
    }): CancelablePromise<TaskHistoryListResponseDto> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/tasks/{id}/history',
            path: {
                'id': id,
            },
            query: {
                'page': page,
                'limit': limit,
            },
            errors: {
                400: `Parâmetros inválidos ou ID da tarefa inválido`,
                401: `Não autenticado`,
                404: `Tarefa não encontrada`,
                500: `Erro inesperado no task-service ou gateway`,
            },
        });
    }
}
