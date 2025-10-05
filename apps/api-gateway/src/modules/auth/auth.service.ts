import { Injectable } from '@nestjs/common';
import { createLogger } from '@taskscore/utils';
import {
  AuthRequestsRPCMessage,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
} from '@taskscore/types';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { GatewayEnv } from '../../../config/envLoader';

@Injectable()
export class AuthService {
  private readonly logger = createLogger({
    service: 'auth-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly rabbitMQService: RabbitMQService, private readonly configService: ConfigService<GatewayEnv, true>) { }

  async register(registerDto: RegisterRequestDto, correlationId: string): Promise<RegisterResponseDto> {
    this.logger.info('Forwarding register request to auth service', {
      correlationId,
      email: registerDto.email
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<RegisterRequestDto, RegisterResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.Register,
        registerDto,
        correlationId
      );

      this.logger.info('Register request forwarded successfully', {
        correlationId,
        email: registerDto.email
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward register request', {
        correlationId,
        email: registerDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async login(loginDto: LoginRequestDto, correlationId: string): Promise<LoginResponseDto> {
    this.logger.info('Forwarding login request to auth service', {
      correlationId,
      email: loginDto.email
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<LoginRequestDto, LoginResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.Login,
        loginDto,
        correlationId
      );

      this.logger.info('Login request forwarded successfully', {
        correlationId,
        email: loginDto.email
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward login request', {
        correlationId,
        email: loginDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto, correlationId: string): Promise<RefreshTokenResponseDto> {
    this.logger.info('Forwarding token refresh request to auth service', {
      correlationId
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<RefreshTokenRequestDto, RefreshTokenResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.Refresh,
        refreshTokenDto,
        correlationId
      );

      this.logger.info('Token refresh request forwarded successfully', {
        correlationId
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward token refresh request', {
        correlationId,
        error: errorMessage
      });
      throw error;
    }
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordRequestDto, correlationId: string): Promise<ForgotPasswordResponseDto> {
    this.logger.info('Forwarding password reset request to auth service', {
      correlationId,
      email: forgotPasswordDto.email
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<ForgotPasswordRequestDto, ForgotPasswordResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.ForgotPassword,
        forgotPasswordDto,
        correlationId
      );

      this.logger.info('Password reset request forwarded successfully', {
        correlationId,
        email: forgotPasswordDto.email
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward password reset request', {
        correlationId,
        email: forgotPasswordDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async resetPassword( resetPasswordDto: ResetPasswordRequestDto, correlationId: string): Promise<ResetPasswordResponseDto> {
    this.logger.info('Forwarding password reset execution to auth service', {
      correlationId,
      token: resetPasswordDto.token.substring(0, 8) + '...'
    });

    try {
      await this.rabbitMQService.sendToQueue<ResetPasswordRequestDto, ResetPasswordResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.ResetPassword,
        resetPasswordDto,
        correlationId
      );

      this.logger.info('Password reset execution forwarded successfully', {
        correlationId,
        token: resetPasswordDto.token.substring(0, 8) + '...'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward password reset execution', {
        correlationId,
        token: resetPasswordDto.token.substring(0, 8) + '...',
        error: errorMessage
      });
      throw error;
    }
  }

  async getUserById(userId: string, correlationId: string): Promise<any> {
    this.logger.info('Requesting user data from auth service', {
      correlationId,
      userId
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<{ userId: string }, any>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.GetUserById,
        { userId },
        correlationId
      );

      this.logger.info('User data retrieved successfully', {
        correlationId,
        userId
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get user data', {
        correlationId,
        userId,
        error: errorMessage
      });
      throw error;
    }
  }
}
