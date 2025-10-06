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
  GetUserByIdRequestDto,
  UserResponseDto,
} from '@taskscore/types';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { GatewayEnv } from '../../config/envLoader.config';

@Injectable()
export class AuthService {
  private readonly logger = createLogger({
    service: 'auth-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly rabbitMQService: RabbitMQService, private readonly configService: ConfigService<GatewayEnv, true>) { }

  async register(registerDto: RegisterRequestDto, traceId: string): Promise<RegisterResponseDto> {
    this.logger.info('Forwarding register request to auth service', {
      traceId,
      email: registerDto.email
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<RegisterRequestDto, RegisterResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.Register,
        registerDto,
        traceId
      );

      this.logger.info('Register request forwarded successfully', {
        traceId,
        email: registerDto.email
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward register request', {
        traceId,
        email: registerDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async login(loginDto: LoginRequestDto, traceId: string): Promise<LoginResponseDto> {
    this.logger.info('Forwarding login request to auth service', {
      traceId,
      email: loginDto.email
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<LoginRequestDto, LoginResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.Login,
        loginDto,
        traceId
      );

      this.logger.info('Login request forwarded successfully', {
        traceId,
        email: loginDto.email
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward login request', {
        traceId,
        email: loginDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto, traceId: string): Promise<RefreshTokenResponseDto> {
    this.logger.info('Forwarding token refresh request to auth service', {
      traceId
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<RefreshTokenRequestDto, RefreshTokenResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.Refresh,
        refreshTokenDto,
        traceId
      );

      this.logger.info('Token refresh request forwarded successfully', {
        traceId
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward token refresh request', {
        traceId,
        error: errorMessage
      });
      throw error;
    }
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordRequestDto, traceId: string): Promise<ForgotPasswordResponseDto> {
    this.logger.info('Forwarding password reset request to auth service', {
      traceId,
      email: forgotPasswordDto.email
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<ForgotPasswordRequestDto, ForgotPasswordResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.ForgotPassword,
        forgotPasswordDto,
        traceId
      );

      this.logger.info('Password reset request forwarded successfully', {
        traceId,
        email: forgotPasswordDto.email
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward password reset request', {
        traceId,
        email: forgotPasswordDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async resetPassword( resetPasswordDto: ResetPasswordRequestDto, traceId: string): Promise<ResetPasswordResponseDto> {
    this.logger.info('Forwarding password reset execution to auth service', {
      traceId,
      token: resetPasswordDto.token.substring(0, 8) + '...'
    });

    try {
      await this.rabbitMQService.sendToQueue<ResetPasswordRequestDto, ResetPasswordResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.ResetPassword,
        resetPasswordDto,
        traceId
      );

      this.logger.info('Password reset execution forwarded successfully', {
        traceId,
        token: resetPasswordDto.token.substring(0, 8) + '...'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to forward password reset execution', {
        traceId,
        token: resetPasswordDto.token.substring(0, 8) + '...',
        error: errorMessage
      });
      throw error;
    }
  }

  async getUserById(userId: string, traceId: string): Promise<UserResponseDto> {
    this.logger.info('Requesting user data from auth service', {
      traceId,
      userId
    });

    try {
      const result = await this.rabbitMQService.sendToQueue<GetUserByIdRequestDto, UserResponseDto>(
        this.configService.get('rabbitmq.queues.auth', { infer: true }),
        AuthRequestsRPCMessage.GetUserById,
        { userId },
        traceId
      );

      this.logger.info('User data retrieved successfully', {
        traceId,
        userId
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to get user data', {
        traceId,
        userId,
        error: errorMessage
      });
      throw error;
    }
  }
}
