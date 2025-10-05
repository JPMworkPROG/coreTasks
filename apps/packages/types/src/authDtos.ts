import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class LoginRequestDto {
   @IsEmail({}, { message: 'Email must be a valid email address' })
   @IsNotEmpty({ message: 'Email is required' })
   email: string;

   @IsString({ message: 'Password must be a string' })
   @IsNotEmpty({ message: 'Password is required' })
   password: string;
}

export class LoginResponseDto {
   @IsString({ message: 'Access token must be a string' })
   accessToken: string;

   @IsString({ message: 'Refresh token must be a string' })
   refreshToken: string;
}

export class RegisterRequestDto {
   @IsEmail({}, { message: 'Email must be a valid email address' })
   @IsNotEmpty({ message: 'Email is required' })
   email: string;

   @IsString({ message: 'Username must be a string' })
   @IsNotEmpty({ message: 'Username is required' })
   username: string;

   @IsString({ message: 'Password must be a string' })
   @MinLength(6, { message: 'Password must be at least 6 characters long' })
   @MaxLength(50, { message: 'Password must be at most 50 characters long' })
   @IsNotEmpty({ message: 'Password is required' })
   password: string;
}

export class RegisterResponseDto {
   @IsString({ message: 'Access token must be a string' })
   accessToken: string;

   @IsString({ message: 'Refresh token must be a string' })
   refreshToken: string;
}

export class RefreshTokenRequestDto {
   @IsString({ message: 'Refresh token must be a string' })
   @IsNotEmpty({ message: 'Refresh token is required' })
   refreshToken: string;
}

export class RefreshTokenResponseDto {
   @IsString({ message: 'Access token must be a string' })
   accessToken: string;

   @IsString({ message: 'Refresh token must be a string' })
   refreshToken: string;
}

export class ForgotPasswordRequestDto {
   @IsEmail({}, { message: 'Email must be a valid email address' })
   @IsNotEmpty({ message: 'Email is required' })
   email: string;
}

export class ForgotPasswordResponseDto {
   @IsString({ message: 'Token must be a string' })
   token: string;
}

export class ResetPasswordRequestDto {
   @IsString({ message: 'Token must be a string' })
   @IsNotEmpty({ message: 'Token is required' })
   token: string;

   @IsString({ message: 'New password must be a string' })
   @MinLength(6, { message: 'New password must be at least 6 characters long' })
   @MaxLength(50, { message: 'New password must be at most 50 characters long' })
   @IsNotEmpty({ message: 'New password is required' })
   newPassword: string;
}

export type ResetPasswordResponseDto = void;