import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

class PaginationQueryDto {
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
}

export class CommentListQueryDto extends PaginationQueryDto {}

export class HistoryListQueryDto extends PaginationQueryDto {}
