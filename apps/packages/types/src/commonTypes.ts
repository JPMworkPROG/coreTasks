import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  IsNotEmpty,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationMetadataDto {
   @IsNumber({}, { message: 'Página deve ser um número' })
   @Min(1, { message: 'Página deve ser maior que 0' })
   page: number;

   @IsNumber({}, { message: 'Limite deve ser um número' })
   @Min(1, { message: 'Limite deve ser maior que 0' })
   limit: number;

   @IsNumber({}, { message: 'Total deve ser um número' })
   @Min(0, { message: 'Total não pode ser negativo' })
   total: number;

   @IsNumber({}, { message: 'Total de páginas deve ser um número' })
   @Min(0, { message: 'Total de páginas não pode ser negativo' })
   totalPages: number;
}

export class ApiErrorItemDto {
  @IsString({ message: 'Campo deve ser uma string' })
  @IsNotEmpty({ message: 'Campo é obrigatório' })
  field: string;

  @IsString({ message: 'Mensagem deve ser uma string' })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  message: string;
}

export class ApiErrorResponseDto {
  @IsOptional()
  @IsString({ message: 'Tipo deve ser uma string' })
  type?: string;

  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @IsNumber({}, { message: 'Status deve ser um número' })
  @IsInt({ message: 'Status deve ser um número inteiro' })
  status: number;

  @IsOptional()
  @IsString({ message: 'Detalhe deve ser uma string' })
  detail?: string;

  @IsOptional()
  @IsString({ message: 'Instance deve ser uma string' })
  instance?: string;

  @IsOptional()
  @IsString({ message: 'TraceId deve ser uma string' })
  traceId?: string;

  @IsOptional()
  @IsArray({ message: 'Errors deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ApiErrorItemDto)
  errors?: ApiErrorItemDto[];
}

export class ApiSuccessResponseDto<T = any> {
   @IsOptional()
   payload?: T;

   @IsOptional()
   @IsString({ message: 'Mensagem deve ser uma string' })
   message?: string;

   @IsOptional()
   @IsString({ message: 'Erro deve ser uma string' })
   error?: string;

   @IsOptional()
   metadata?: PaginationMetadataDto;
}
