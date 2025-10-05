import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationMetadataDto } from './commonTypes';

export class GetUserByIdRequestDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId!: string;
}

export class ListUsersRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'userName must be a string' })
  @MaxLength(100, { message: 'userName must not exceed 100 characters' })
  userName?: string;
}

export class UserResponseDto {
  @IsUUID('4')
  id!: string;

  @IsString()
  email!: string;

  @IsString()
  username!: string;

  @IsString()
  role!: string;

  @IsBoolean()
  isActive!: boolean;

  @IsDateString()
  createdAt!: string;

  @IsDateString()
  updatedAt!: string;

  @IsOptional()
  @IsDateString()
  lastLoginAt?: string | null;
}

export class UserListResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserResponseDto)
  data!: UserResponseDto[];

  @ValidateNested()
  @Type(() => PaginationMetadataDto)
  meta!: PaginationMetadataDto;

  @IsBoolean()
  success: boolean = true;

  @IsOptional()
  message?: string | null;

  @IsOptional()
  error?: string | null;
}
