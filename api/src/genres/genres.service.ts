import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGenreDto: CreateGenreDto) {
    const existing = await this.prisma.genre.findUnique({
      where: { name: createGenreDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Genre with name "${createGenreDto.name}" already exists`,
      );
    }
    return this.prisma.genre.create({
      data: createGenreDto,
    });
  }

  async findAll() {
    return this.prisma.genre.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        books: true,
      },
    });
    if (!genre) {
      throw new NotFoundException(`Genre with ID "${id}" not found`);
    }
    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    await this.findOne(id);
    if (updateGenreDto.name) {
      const existing = await this.prisma.genre.findUnique({
        where: { name: updateGenreDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Genre with name "${updateGenreDto.name}" already exists`,
        );
      }
    }
    return this.prisma.genre.update({
      where: { id },
      data: updateGenreDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.genre.delete({
      where: { id },
    });
  }
}

