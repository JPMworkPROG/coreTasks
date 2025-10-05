import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import {
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
import { createLogger } from '@taskscore/utils';
import { JwtAuthGuard } from '../../guards/jwtAuth.guard';

@Controller('api/auth')
export class AuthController {
  private readonly logger = createLogger({
    service: 'auth-api-gateway',
    environment: process.env.NODE_ENV ?? 'development',
  });
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterRequestDto, @Req() req: Request): Promise<RegisterResponseDto> {
    const correlationId = req['correlationId'];
    this.logger.info('User registration request received', { 
      correlationId,
      email: registerDto.email 
    });

    try {
      const result = await this.authService.register(registerDto, correlationId);
      this.logger.info('User registration completed successfully', { 
        correlationId,
        email: registerDto.email
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('User registration failed', { 
        correlationId,
        email: registerDto.email,
        error: errorMessage 
      });
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequestDto, @Req() req: Request): Promise<LoginResponseDto> {
    const correlationId = req['correlationId'];
    this.logger.info('User login request received', { 
      correlationId,
      email: loginDto.email 
    });

    try {
      const result = await this.authService.login(loginDto, correlationId);
      this.logger.info('User login completed successfully', { 
        correlationId,
        email: loginDto.email
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('User login failed', { 
        correlationId,
        email: loginDto.email,
        error: errorMessage 
      });
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(@Body() refreshDto: RefreshTokenRequestDto, @Req() req: Request): Promise<RefreshTokenResponseDto> {
    const correlationId = req['correlationId'];
    this.logger.info('Token refresh request received', { correlationId });

    try {
      const result = await this.authService.refreshToken(refreshDto, correlationId);
      this.logger.info('Token refresh completed successfully', { 
        correlationId
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Token refresh failed', { 
        correlationId,
        error: errorMessage 
      });
      throw error;
    }
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequestDto, @Req() req: Request): Promise<ForgotPasswordResponseDto> {
    const correlationId = req['correlationId'];
    this.logger.info('Password reset request received', { 
      correlationId,
      email: forgotPasswordDto.email 
    });

    try {
      const result = await this.authService.requestPasswordReset(forgotPasswordDto, correlationId);
      this.logger.info('Password reset request processed successfully', { 
        correlationId,
        email: forgotPasswordDto.email 
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Password reset request failed', { 
        correlationId,
        email: forgotPasswordDto.email,
        error: errorMessage 
      });
      throw error;
    }
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordRequestDto, @Req() req: Request): Promise<ResetPasswordResponseDto> {
    const correlationId = req['correlationId'];
    this.logger.info('Password reset execution request received', { 
      correlationId,
      token: resetPasswordDto.token.substring(0, 8) + '...' 
    });

    try {
      await this.authService.resetPassword(resetPasswordDto, correlationId);
      this.logger.info('Password reset executed successfully', { 
        correlationId,
        token: resetPasswordDto.token.substring(0, 8) + '...' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Password reset execution failed', { 
        correlationId,
        token: resetPasswordDto.token.substring(0, 8) + '...',
        error: errorMessage 
      });
      throw error;
    }
  }

  // Exemplos de rotas protegidas
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: any) {
    const correlationId = req['correlationId'];
    const user = req.user; // User comes from JwtStrategy.validate()
    
    this.logger.info('Profile request received', { 
      correlationId,
      userId: user.id,
      email: user.email 
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const correlationId = req['correlationId'];
    const user = req.user;
    
    this.logger.info('Logout request received', { 
      correlationId,
      userId: user.id,
      email: user.email 
    });

    // Here you could invalidate the token in the authentication service
    // await this.authService.logout(user.id, correlationId);
    
    return {
      message: 'Logout completed successfully'
    };
  }
}