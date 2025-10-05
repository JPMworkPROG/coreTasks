import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@taskscore/utils';
import { PasswordResetToken } from '@taskscore/utils';
import { createLogger } from '@taskscore/utils';

@Injectable()
export class AuthRepository {
  private readonly logger = createLogger({
    service: 'auth-repository',
    environment: process.env.NODE_ENV ?? 'development',
  });

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug('Searching user by email', { email });
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'username', 'password', 'isActive', 'createdAt', 'updatedAt', 'lastLoginAt']
      });
      
      this.logger.debug('User search completed', { 
        email, 
        found: !!user,
        userId: user?.id 
      });
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to find user by email', { 
        email, 
        error: errorMessage 
      });
      throw error;
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      this.logger.debug('Searching user by username', { username });
      const user = await this.userRepository.findOne({
        where: { username },
        select: ['id', 'email', 'username', 'password', 'isActive', 'createdAt', 'updatedAt', 'lastLoginAt']
      });
      
      this.logger.debug('User search by username completed', { 
        username, 
        found: !!user,
        userId: user?.id 
      });
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to find user by username', { 
        username, 
        error: errorMessage 
      });
      throw error;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      this.logger.debug('Searching user by ID', { userId: id });
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'email', 'username', 'isActive', 'createdAt', 'updatedAt', 'lastLoginAt']
      });
      
      this.logger.debug('User search by ID completed', { 
        userId: id, 
        found: !!user 
      });
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to find user by ID', { 
        userId: id, 
        error: errorMessage 
      });
      throw error;
    }
  }

  async createUser(userData: {
    email: string;
    username: string;
    password: string;
  }): Promise<User> {
    try {
      this.logger.debug('Creating new user', { 
        email: userData.email, 
        username: userData.username 
      });

      const user = this.userRepository.create({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        isActive: true,
      });

      const savedUser = await this.userRepository.save(user);
      
      this.logger.info('User created successfully', { 
        userId: savedUser.id,
        email: savedUser.email,
        username: savedUser.username 
      });
      
      return savedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to create user', { 
        email: userData.email,
        username: userData.username,
        error: errorMessage 
      });
      throw error;
    }
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    try {
      this.logger.debug('Updating user last login', { userId });
      
      await this.userRepository.update(userId, {
        lastLoginAt: new Date(),
      });
      
      this.logger.debug('User last login updated successfully', { userId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to update user last login', { 
        userId, 
        error: errorMessage 
      });
      throw error;
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.debug('Updating user password', { userId });
      
      await this.userRepository.update(userId, {
        password: newPassword,
      });
      
      this.logger.info('User password updated successfully', { userId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to update user password', { 
        userId, 
        error: errorMessage 
      });
      throw error;
    }
  }

  async createPasswordResetToken(tokenData: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedBy?: string;
  }): Promise<PasswordResetToken> {
    try {
      this.logger.debug('Creating password reset token', { 
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt 
      });

      const resetToken = this.resetTokenRepository.create({
        userId: tokenData.userId,
        tokenHash: tokenData.tokenHash,
        expiresAt: tokenData.expiresAt,
        requestedBy: tokenData.requestedBy,
      });

      const savedToken = await this.resetTokenRepository.save(resetToken);
      
      this.logger.info('Password reset token created successfully', { 
        tokenId: savedToken.id,
        userId: savedToken.userId 
      });
      
      return savedToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to create password reset token', { 
        userId: tokenData.userId,
        error: errorMessage 
      });
      throw error;
    }
  }

  async findValidResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    try {
      this.logger.debug('Searching for valid reset token', { 
        tokenHash: tokenHash.substring(0, 8) + '...' 
      });

      const token = await this.resetTokenRepository.findOne({
        where: {
          tokenHash,
          usedAt: null as any,
        },
        relations: ['user'],
      });

      if (token && token.expiresAt > new Date()) {
        this.logger.debug('Valid reset token found', { 
          tokenId: token.id,
          userId: token.userId 
        });
        return token;
      }

      this.logger.debug('No valid reset token found', { 
        tokenHash: tokenHash.substring(0, 8) + '...' 
      });
      
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to find valid reset token', { 
        tokenHash: tokenHash.substring(0, 8) + '...',
        error: errorMessage 
      });
      throw error;
    }
  }

  async findValidResetTokenByComparison(plainToken: string): Promise<PasswordResetToken | null> {
    try {
      this.logger.debug('Searching for valid reset token by comparison', { 
        token: plainToken.substring(0, 8) + '...' 
      });

      // Find all unused tokens that haven't expired yet
      const tokens = await this.resetTokenRepository.find({
        where: {
          usedAt: null as any,
        },
        relations: ['user'],
      });

      this.logger.debug('Found unused tokens', { 
        totalTokens: tokens.length 
      });

      // Filter tokens that haven't expired
      const validTokens = tokens.filter(token => token.expiresAt > new Date());

      this.logger.debug('Found non-expired tokens', { 
        validTokens: validTokens.length,
        expiredTokens: tokens.length - validTokens.length
      });

      // Compare the plain token with each stored hash
      for (const token of validTokens) {
        const isMatch = await bcrypt.compare(plainToken, token.tokenHash);
        if (isMatch) {
          this.logger.info('Valid reset token found by comparison', { 
            tokenId: token.id,
            userId: token.userId,
            expiresAt: token.expiresAt,
            createdAt: token.createdAt
          });
          return token;
        }
      }

      this.logger.warn('No valid reset token found by comparison', { 
        token: plainToken.substring(0, 8) + '...',
        totalTokensChecked: validTokens.length
      });
      
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to find valid reset token by comparison', { 
        token: plainToken.substring(0, 8) + '...',
        error: errorMessage 
      });
      throw error;
    }
  }

  async markResetTokenAsUsed(tokenId: string): Promise<void> {
    try {
      this.logger.debug('Marking reset token as used', { tokenId });
      
      await this.resetTokenRepository.update(tokenId, {
        usedAt: new Date(),
      });
      
      this.logger.info('Reset token marked as used successfully', { tokenId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to mark reset token as used', { 
        tokenId, 
        error: errorMessage 
      });
      throw error;
    }
  }

  async deleteExpiredResetTokens(): Promise<number> {
    try {
      this.logger.debug('Deleting expired reset tokens');
      
      const result = await this.resetTokenRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now', { now: new Date() })
        .execute();
      
      const deletedCount = result.affected || 0;
      
      this.logger.info('Expired reset tokens deleted', { deletedCount });
      
      return deletedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to delete expired reset tokens', { 
        error: errorMessage 
      });
      throw error;
    }
  }
}
