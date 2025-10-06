import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { createLogger } from '@taskscore/utils';
import {
  AuthRequestsRPCMessage,
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto
} from '@taskscore/types';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = createLogger({
    service: 'auth-controller',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(private readonly authService: AuthService) { }

  @MessagePattern(AuthRequestsRPCMessage.Register)
  async register(data: { payload: RegisterRequestDto; traceId: string }): Promise<RegisterResponseDto> {
    const { payload: registerDto, traceId } = data;
    this.logger.info('User registration request received', { traceId, email: registerDto.email, username: registerDto.username });
    const result = await this.authService.register(registerDto, traceId);
    this.logger.info('User registration completed successfully', { traceId, email: registerDto.email, username: registerDto.username });
    return result;
  }

  @MessagePattern(AuthRequestsRPCMessage.Login)
  async login(data: { payload: LoginRequestDto; traceId: string }): Promise<LoginResponseDto> {
    const { payload: loginDto, traceId } = data;
    this.logger.info('User login request received', { traceId, email: loginDto.email });
    const result = await this.authService.login(loginDto, traceId);
    this.logger.info('User login completed successfully', { traceId, email: loginDto.email });
    return result;
  }

  @MessagePattern(AuthRequestsRPCMessage.Refresh)
  async refreshToken(data: { payload: RefreshTokenRequestDto; traceId: string }): Promise<RefreshTokenResponseDto> {
    const { payload: refreshTokenDto, traceId } = data;
    this.logger.info('Token refresh request received', { traceId });
    const result = await this.authService.refreshToken(refreshTokenDto, traceId);
    this.logger.info('Token refresh completed successfully', { traceId });
    return result;
  }

  @MessagePattern(AuthRequestsRPCMessage.ForgotPassword)
  async forgotPassword(data: { payload: ForgotPasswordRequestDto; traceId: string }): Promise<ForgotPasswordResponseDto> {
    const { payload: forgotPasswordDto, traceId } = data;
    this.logger.info('Password forgot request received', { traceId, email: forgotPasswordDto.email });
    const result = await this.authService.requestPasswordReset(forgotPasswordDto, traceId);
    this.logger.info('Password forgot completed successfully', { traceId, email: forgotPasswordDto.email });
    return result;
  }

  @MessagePattern(AuthRequestsRPCMessage.ResetPassword)
  async resetPassword(data: { payload: ResetPasswordRequestDto; traceId: string }): Promise<ResetPasswordResponseDto> {
    const { payload: resetPasswordDto, traceId } = data;
    this.logger.info('Password reset password request received', {traceId,token: resetPasswordDto.token.substring(0, 8) + '...'});
    const result = await this.authService.resetPassword(resetPasswordDto, traceId);
    this.logger.info('Password reset password completed successfully', { traceId, token: resetPasswordDto.token.substring(0, 8) + '...' });
    return result;
  }
}