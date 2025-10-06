import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { createLogger } from '@taskscore/utils';
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
  ResetPasswordResponseDto,
  JwtPayload
} from '@taskscore/types';
import { AuthRepository } from './auth.repository';
import { ConfigService } from '@nestjs/config';
import { AuthEnv } from '../config/envLoader';

@Injectable()
export class AuthService {
  private readonly logger = createLogger({
    service: 'auth-service',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AuthEnv, true>,
  ) {}

  async register(registerDto: RegisterRequestDto, traceId: string): Promise<RegisterResponseDto> {
    this.logger.info('Processing user registration', {
      traceId,
      email: registerDto.email,
      username: registerDto.username
    });

    try {
      // Check if email already exists
      const existingUserByEmail = await this.authRepository.findUserByEmail(registerDto.email);
      if (existingUserByEmail) {
        this.logger.warn('Registration failed: email already exists', {
          traceId,
          email: registerDto.email
        });
        throw new ConflictException('Email is already registered. Try logging in or use another email.');
      }

      // Check if username already exists
      const existingUserByUsername = await this.authRepository.findUserByUsername(registerDto.username);
      if (existingUserByUsername) {
        this.logger.warn('Registration failed: username already exists', {
          traceId,
          username: registerDto.username
        });
        throw new ConflictException('Username is already taken. Please choose another username.');
      }

      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

      // Create user
      const user = await this.authRepository.createUser({
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword
      });

      // Generate tokens
      const tokens = await this.generateTokens(user, traceId);

      this.logger.info('User registration completed successfully', {
        traceId,
        userId: user.id,
        email: user.email,
        username: user.username
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('User registration failed', {
        traceId,
        email: registerDto.email,
        username: registerDto.username,
        error: errorMessage
      });
      throw error;
    }
  }

  async login(loginDto: LoginRequestDto, traceId: string): Promise<LoginResponseDto> {
    this.logger.info('Processing user login', {
      traceId,
      email: loginDto.email
    });

    try {
      // Find user by email
      const user = await this.authRepository.findUserByEmail(loginDto.email);
      if (!user) {
        this.logger.warn('Login failed: user not found', {
          traceId,
          email: loginDto.email
        });
        throw new UnauthorizedException('The email and password combination is not valid.');
      }

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn('Login failed: user is inactive', {
          traceId,
          userId: user.id,
          email: user.email
        });
        throw new UnauthorizedException('Account is deactivated. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn('Login failed: invalid password', {
          traceId,
          userId: user.id,
          email: user.email
        });
        throw new UnauthorizedException('The email and password combination is not valid.');
      }

      // Update last login
      await this.authRepository.updateUserLastLogin(user.id);

      // Gerar tokens
      const tokens = await this.generateTokens(user, traceId);

      this.logger.info('User login completed successfully', {
        traceId,
        userId: user.id,
        email: user.email,
        username: user.username
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('User login failed', {
        traceId,
        email: loginDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto, traceId: string): Promise<RefreshTokenResponseDto> {
    this.logger.info('Processing token refresh', {
      traceId
    });

    try {
      // Verify and decode refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true })
      }) as JwtPayload;

      // Find user
      const user = await this.authRepository.findUserById(payload.sub);
      if (!user) {
        this.logger.warn('Token refresh failed: user not found', {
          traceId,
          userId: payload.sub
        });
        throw new UnauthorizedException('The supplied refresh token is expired or revoked.');
      }

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn('Token refresh failed: user is inactive', {
          traceId,
          userId: user.id
        });
        throw new UnauthorizedException('Account is deactivated. Please contact support.');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user, traceId);

      this.logger.info('Token refresh completed successfully', {
        traceId,
        userId: user.id,
        email: user.email
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Token refresh failed', {
        traceId,
        error: errorMessage
      });
      throw error;
    }
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordRequestDto, traceId: string): Promise<ForgotPasswordResponseDto> {
    this.logger.info('Processing password reset request', {
      traceId,
      email: forgotPasswordDto.email
    });

    try {
      // Find user by email
      const user = await this.authRepository.findUserByEmail(forgotPasswordDto.email);
      if (!user) {
        // For security, we don't reveal if the email exists or not
        this.logger.info('Password reset request for non-existent email (security measure)', {
          traceId,
          email: forgotPasswordDto.email
        });
        
        // Return success even if user doesn't exist (security measure)
        return {
          token: 'dummy-token-for-security'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        this.logger.warn('Password reset request for inactive user', {
          traceId,
          userId: user.id,
          email: user.email
        });
        throw new BadRequestException('Account is deactivated. Please contact support.');
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      this.logger.debug('Password reset token generated', {
        traceId,
        userId: user.id,
        token: resetToken.substring(0, 8) + '...',
        expiresAt: expiresAt.toISOString()
      });

      // Salvar token no banco
      const savedToken = await this.authRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
        requestedBy: 'user'
      });

      this.logger.debug('Password reset token saved to database', {
        traceId,
        tokenId: savedToken.id,
        userId: user.id
      });

      // TODO: Enviar email com o token
      // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      this.logger.info('Password reset token generated successfully', {
        traceId,
        userId: user.id,
        email: user.email,
        tokenId: savedToken.id
      });

      return {
        token: resetToken
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Password reset request failed', {
        traceId,
        email: forgotPasswordDto.email,
        error: errorMessage
      });
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordRequestDto, traceId: string): Promise<ResetPasswordResponseDto> {
    this.logger.info('Processing password reset execution', {
      traceId,
      token: resetPasswordDto.token.substring(0, 8) + '...'
    });

    try {
      // Find valid token by comparing the provided token with stored hashes
      const resetToken = await this.authRepository.findValidResetTokenByComparison(resetPasswordDto.token);
      if (!resetToken) {
        this.logger.warn('Password reset failed: invalid or expired token', {
          traceId,
          token: resetPasswordDto.token.substring(0, 8) + '...'
        });
        throw new BadRequestException('The provided token has expired or is not valid anymore.');
      }

      // Check if user still exists and is active
      const user = await this.authRepository.findUserById(resetToken.userId);
      if (!user || !user.isActive) {
        this.logger.warn('Password reset failed: user not found or inactive', {
          traceId,
          userId: resetToken.userId
        });
        throw new BadRequestException('User not found or account is deactivated.');
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

      // Update user password
      await this.authRepository.updateUserPassword(user.id, hashedPassword);

      // Marcar token como usado
      await this.authRepository.markResetTokenAsUsed(resetToken.id);

      this.logger.info('Password reset completed successfully', {
        traceId,
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Password reset execution failed', {
        traceId,
        token: resetPasswordDto.token.substring(0, 8) + '...',
        error: errorMessage
      });
      throw error;
    }
  }

  async getUserById(userId: string, traceId: string): Promise<any> {
    this.logger.info('Processing get user by ID request', {
      traceId,
      userId
    });

    try {
      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        this.logger.warn('Get user failed: user not found', {
          traceId,
          userId
        });
        throw new NotFoundException('User not found.');
      }

      this.logger.info('User data retrieved successfully', {
        traceId,
        userId,
        email: user.email,
        username: user.username
      });

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Get user by ID failed', {
        traceId,
        userId,
        error: errorMessage
      });
      throw error;
    }
  }

  private async generateTokens(user: any, traceId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.accessSecret', { infer: true }),
        expiresIn: this.configService.get('jwt.accessExpiresIn', { infer: true })
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret', { infer: true }),
        expiresIn: this.configService.get('jwt.refreshExpiresIn', { infer: true })
      })
    ]);

    this.logger.debug('Tokens generated successfully', {
      traceId,
      userId: user.id,
      email: user.email
    });

    return { accessToken, refreshToken };
  }
}
