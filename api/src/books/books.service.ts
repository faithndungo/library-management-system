import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

export interface FindAllBooksQuery {
  genreId?: string;
  search?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: createBookDto.genreId },
    });
    if (!genre) {
      throw new NotFoundException(
        `Genre with ID "${createBookDto.genreId}" not found`,
      );
    }

    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });
    if (existingBook) {
      throw new ConflictException(
        `Book with ISBN "${createBookDto.isbn}" already exists`,
      );
    }

    return this.prisma.book.create({
      data: {
        title: createBookDto.title,
        author: createBookDto.author,
        isbn: createBookDto.isbn,
        totalCopies: createBookDto.totalCopies,
        availableCopies: createBookDto.totalCopies,
        genreId: createBookDto.genreId,
        publicationYear: createBookDto.publicationYear,
      },
      include: { genre: true },
    });
  }

  async findAll(query: FindAllBooksQuery) {
    const { genreId, search, page, limit } = query;

    // Build the Prisma where clause from genreId and search
    const where: Prisma.BookWhereInput = {};

    if (genreId) {
      where.genreId = genreId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply pagination skip / take
    const pageNumber = page && !isNaN(Number(page)) ? Math.max(1, Number(page)) : 1;
    const pageSize = limit && !isNaN(Number(limit)) ? Math.max(1, Number(limit)) : 10;
    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take,
        include: { genre: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        genre: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    if (updateBookDto.genreId) {
      const genre = await this.prisma.genre.findUnique({
        where: { id: updateBookDto.genreId },
      });
      if (!genre) {
        throw new NotFoundException(
          `Genre with ID "${updateBookDto.genreId}" not found`,
        );
      }
    }

    if (updateBookDto.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn: updateBookDto.isbn },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Book with ISBN "${updateBookDto.isbn}" already exists`,
        );
      }
    }

    return this.prisma.book.update({
      where: { id },
      data: updateBookDto,
      include: { genre: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.book.delete({
      where: { id },
    });
  }
}

