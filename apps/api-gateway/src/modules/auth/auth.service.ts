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
import { GatewayEnv } from '../../config/envLoader.config';

@Injectable()
export class AuthService {
  private readonly authQueue = this.configService.get('rabbitmq.queues.auth', { infer: true });
  private readonly logger = createLogger({
    service: 'auth-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly rabbitMQService: RabbitMQService, private readonly configService: ConfigService<GatewayEnv, true>) { }

  async register(registerDto: RegisterRequestDto, traceId: string): Promise<RegisterResponseDto> {
    try {
      const result = await this.rabbitMQService.sendToQueue<RegisterRequestDto, RegisterResponseDto>(
        this.authQueue,
        AuthRequestsRPCMessage.Register,
        registerDto,
        traceId
      );
      this.logger.info('Register request forwarded successfully', { traceId, email: registerDto.email });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward register request', { traceId, email: registerDto.email, error: error.message });
      throw error;
    }
  }

  async login(loginDto: LoginRequestDto, traceId: string): Promise<LoginResponseDto> {
    try {
      const result = await this.rabbitMQService.sendToQueue<LoginRequestDto, LoginResponseDto>(
        this.authQueue,
        AuthRequestsRPCMessage.Login,
        loginDto,
        traceId
      );
      this.logger.info('Login request forwarded successfully', { traceId, email: loginDto.email });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward login request', { traceId, email: loginDto.email, error: error.message });
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto, traceId: string): Promise<RefreshTokenResponseDto> {
    try {
      const result = await this.rabbitMQService.sendToQueue<RefreshTokenRequestDto, RefreshTokenResponseDto>(
        this.authQueue,
        AuthRequestsRPCMessage.Refresh,
        refreshTokenDto,
        traceId
      );
      this.logger.info('Token refresh request forwarded successfully', { traceId });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward token refresh request', { traceId, error: error.message });
      throw error;
    }
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordRequestDto, traceId: string): Promise<ForgotPasswordResponseDto> {
    try {
      const result = await this.rabbitMQService.sendToQueue<ForgotPasswordRequestDto, ForgotPasswordResponseDto>(
        this.authQueue,
        AuthRequestsRPCMessage.ForgotPassword,
        forgotPasswordDto,
        traceId
      );
      this.logger.info('Password reset request forwarded successfully', { traceId, email: forgotPasswordDto.email });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward password reset request', { traceId, email: forgotPasswordDto.email, error: error.message });
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordRequestDto, traceId: string): Promise<ResetPasswordResponseDto> {
    try {
      const result = await this.rabbitMQService.sendToQueue<ResetPasswordRequestDto, ResetPasswordResponseDto>(
        this.authQueue,
        AuthRequestsRPCMessage.ResetPassword,
        resetPasswordDto,
        traceId
      );
      this.logger.info('Password reset execution forwarded successfully', { traceId, token: resetPasswordDto.token.substring(0, 8) + '...' });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to forward password reset execution', { traceId, token: resetPasswordDto.token.substring(0, 8) + '...', error: error.message });
      throw error;
    }
  }
}