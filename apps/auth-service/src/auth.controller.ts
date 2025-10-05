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
  async register(data: { payload: RegisterRequestDto; correlationId: string }): Promise<RegisterResponseDto> {
    const { payload: registerDto, correlationId } = data;
    
    this.logger.info('RPC: User registration request received', {
      correlationId,
      email: registerDto.email,
      username: registerDto.username
    });

    try {
      const result = await this.authService.register(registerDto, correlationId);
      
      this.logger.info('RPC: User registration completed successfully', {
        correlationId,
        email: registerDto.email,
        username: registerDto.username
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: User registration failed', {
        correlationId,
        email: registerDto.email,
        username: registerDto.username,
        error: errorMessage
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'User registration failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.Login)
  async login(data: { payload: LoginRequestDto; correlationId: string }): Promise<LoginResponseDto> {
    const { payload: loginDto, correlationId } = data;
    
    this.logger.info('RPC: User login request received', {
      correlationId,
      email: loginDto.email
    });

    try {
      const result = await this.authService.login(loginDto, correlationId);
      
      this.logger.info('RPC: User login completed successfully', {
        correlationId,
        email: loginDto.email
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: User login failed', {
        correlationId,
        email: loginDto.email,
        error: errorMessage
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'User login failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.Refresh)
  async refreshToken(data: { payload: RefreshTokenRequestDto; correlationId: string }): Promise<RefreshTokenResponseDto> {
    const { payload: refreshTokenDto, correlationId } = data;
    
    this.logger.info('RPC: Token refresh request received', {
      correlationId
    });

    try {
      const result = await this.authService.refreshToken(refreshTokenDto, correlationId);
      
      this.logger.info('RPC: Token refresh completed successfully', {
        correlationId
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Token refresh failed', {
        correlationId,
        error: errorMessage
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Token refresh failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.ForgotPassword)
  async forgotPassword(data: { payload: ForgotPasswordRequestDto; correlationId: string }): Promise<ForgotPasswordResponseDto> {
    const { payload: forgotPasswordDto, correlationId } = data;
    
    this.logger.info('RPC: Password reset request received', {
      correlationId,
      email: forgotPasswordDto.email
    });

    try {
      const result = await this.authService.requestPasswordReset(forgotPasswordDto, correlationId);
      
      this.logger.info('RPC: Password reset request processed successfully', {
        correlationId,
        email: forgotPasswordDto.email
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Password reset request failed', {
        correlationId,
        email: forgotPasswordDto.email,
        error: errorMessage
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Password reset request failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.ResetPassword)
  async resetPassword(data: { payload: ResetPasswordRequestDto; correlationId: string }): Promise<ResetPasswordResponseDto> {
    const { payload: resetPasswordDto, correlationId } = data;
    
    this.logger.info('RPC: Password reset execution request received', {
      correlationId,
      token: resetPasswordDto.token.substring(0, 8) + '...'
    });

    try {
      await this.authService.resetPassword(resetPasswordDto, correlationId);
      
      this.logger.info('RPC: Password reset executed successfully', {
        correlationId,
        token: resetPasswordDto.token.substring(0, 8) + '...'
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Password reset execution failed', {
        correlationId,
        token: resetPasswordDto.token.substring(0, 8) + '...',
        error: errorMessage
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Password reset execution failed'
      });
    }
  }

  @MessagePattern(AuthRequestsRPCMessage.GetUserById)
  async getUserById(data: { payload: { userId: string }; correlationId: string }): Promise<any> {
    const { payload, correlationId } = data;
    
    this.logger.info('RPC: Get user by ID request received', {
      correlationId,
      userId: payload.userId
    });

    try {
      const result = await this.authService.getUserById(payload.userId, correlationId);
      
      this.logger.info('RPC: Get user by ID completed successfully', {
        correlationId,
        userId: payload.userId
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('RPC: Get user by ID failed', {
        correlationId,
        userId: payload.userId,
        error: errorMessage
      });
      throw normalizeError(error, {
        correlationId,
        fallbackMessage: 'Get user by ID failed'
      });
    }
  }
}
