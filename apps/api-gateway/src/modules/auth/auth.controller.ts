import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
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
import { JwtRefreshGuard } from '../../guards/jwtRefresh.guard';

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
    const traceId = req['traceId'];
    this.logger.info('User registration request received', { traceId, email: registerDto.email });
    const result = await this.authService.register(registerDto, traceId);
    this.logger.info('User registration completed successfully', { traceId, email: registerDto.email });
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequestDto, @Req() req: Request): Promise<LoginResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('User login request received', { traceId, email: loginDto.email });
    const result = await this.authService.login(loginDto, traceId);
    this.logger.info('User login completed successfully', { traceId, email: loginDto.email });
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Body() refreshDto: RefreshTokenRequestDto, @Req() req: Request): Promise<RefreshTokenResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('Token refresh request received', { traceId });
    const result = await this.authService.refreshToken(refreshDto, traceId);
    this.logger.info('Token refresh completed successfully', { traceId });
    return result;
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequestDto, @Req() req: Request): Promise<ForgotPasswordResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('Password reset request received', { traceId, email: forgotPasswordDto.email });
    const result = await this.authService.requestPasswordReset(forgotPasswordDto, traceId);
    this.logger.info('Password reset request processed successfully', { traceId, email: forgotPasswordDto.email });
    return result;
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordRequestDto, @Req() req: Request): Promise<ResetPasswordResponseDto> {
    const traceId = req['traceId'];
    this.logger.info('Password reset execution request received', { traceId, token: resetPasswordDto.token.substring(0, 8) + '...' });
    const result = await this.authService.resetPassword(resetPasswordDto, traceId);
    this.logger.info('Password reset executed successfully', { traceId, token: resetPasswordDto.token.substring(0, 8) + '...' });
    return result;
  }
}
