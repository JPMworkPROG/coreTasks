import { User } from '@taskscore/utils';
import { UserResponseDto } from '@taskscore/types';

const DEFAULT_ROLE = 'user';

export function mapUserEntityToResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: DEFAULT_ROLE,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

export function mapUsersToResponse(users: User[]): UserResponseDto[] {
  return users.map(mapUserEntityToResponse);
}
