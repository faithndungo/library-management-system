import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  Min,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  isbn: string;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  totalCopies: number;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  genreId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  publicationYear?: number;
}

