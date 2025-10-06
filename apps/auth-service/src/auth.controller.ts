import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { createLogger, normalizeError } from '@taskscore/utils';
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

  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AuthRequestsRPCMessage.Register)
  async register(data: { payload: RegisterRequestDto; traceId: string }): Promise<RegisterResponseDto> {
    const { payload: registerDto, traceId } = data;
    
    this.logger.info('RPC: User registration request received', {
      traceId,
      email: registerDto.email,
      username: registerDto.username
    });

    try {
      const result = await this.authService.register(registerDto, traceId);
      
      this.logger.info('RPC: User registration completed successfully', {
        traceId,
        email: registerDto.email,
        username: registerDto.username
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: User registration failed', {
        traceId,
        email: registerDto.email,
        username: registerDto.username,
        error: errorMessage
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'User registration failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.Login)
  async login(data: { payload: LoginRequestDto; traceId: string }): Promise<LoginResponseDto> {
    const { payload: loginDto, traceId } = data;
    
    this.logger.info('RPC: User login request received', {
      traceId,
      email: loginDto.email
    });

    try {
      const result = await this.authService.login(loginDto, traceId);
      
      this.logger.info('RPC: User login completed successfully', {
        traceId,
        email: loginDto.email
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: User login failed', {
        traceId,
        email: loginDto.email,
        error: errorMessage
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'User login failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.Refresh)
  async refreshToken(data: { payload: RefreshTokenRequestDto; traceId: string }): Promise<RefreshTokenResponseDto> {
    const { payload: refreshTokenDto, traceId } = data;
    
    this.logger.info('RPC: Token refresh request received', {
      traceId
    });

    try {
      const result = await this.authService.refreshToken(refreshTokenDto, traceId);
      
      this.logger.info('RPC: Token refresh completed successfully', {
        traceId
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Token refresh failed', {
        traceId,
        error: errorMessage
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Token refresh failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.ForgotPassword)
  async forgotPassword(data: { payload: ForgotPasswordRequestDto; traceId: string }): Promise<ForgotPasswordResponseDto> {
    const { payload: forgotPasswordDto, traceId } = data;
    
    this.logger.info('RPC: Password reset request received', {
      traceId,
      email: forgotPasswordDto.email
    });

    try {
      const result = await this.authService.requestPasswordReset(forgotPasswordDto, traceId);
      
      this.logger.info('RPC: Password reset request processed successfully', {
        traceId,
        email: forgotPasswordDto.email
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Password reset request failed', {
        traceId,
        email: forgotPasswordDto.email,
        error: errorMessage
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Password reset request failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.ResetPassword)
  async resetPassword(data: { payload: ResetPasswordRequestDto; traceId: string }): Promise<ResetPasswordResponseDto> {
    const { payload: resetPasswordDto, traceId } = data;
    
    this.logger.info('RPC: Password reset execution request received', {
      traceId,
      token: resetPasswordDto.token.substring(0, 8) + '...'
    });

    try {
      await this.authService.resetPassword(resetPasswordDto, traceId);
      
      this.logger.info('RPC: Password reset executed successfully', {
        traceId,
        token: resetPasswordDto.token.substring(0, 8) + '...'
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Password reset execution failed', {
        traceId,
        token: resetPasswordDto.token.substring(0, 8) + '...',
        error: errorMessage
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Password reset execution failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.GetUserById)
  async getUserById(data: { payload: { userId: string }; traceId: string }): Promise<any> {
    const { payload, traceId } = data;
    
    this.logger.info('RPC: Get user by ID request received', {
      traceId,
      userId: payload.userId
    });

    try {
      const result = await this.authService.getUserById(payload.userId, traceId);
      
      this.logger.info('RPC: Get user by ID completed successfully', {
        traceId,
        userId: payload.userId
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Get user by ID failed', {
        traceId,
        userId: payload.userId,
        error: errorMessage
      });
      throw normalizeError(error, {
        traceId,
        fallbackMessage: 'Get user by ID failed'
      });
    }
  }
}
