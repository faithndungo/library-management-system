# Library Management System - Book Catalog Data Layer

A robust, relational data layer for a modern library book catalog built with **TypeScript**, **NestJS**, **Prisma ORM**, and **PostgreSQL**.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Entity-Relationship Diagram](#entity-relationship-diagram)
- [Data Models](#data-models)
  - [Role Enum](#role-enum)
  - [User Model](#user-model)
  - [Genre Model](#genre-model)
  - [Book Model](#book-model)
  - [Review Model (Stretch Goal)](#review-model-stretch-goal)
- [Schema Decisions](#schema-decisions)
  - [Why Book References Genre Rather Than Embedding It](#why-book-references-genre-rather-than-embedding-it)
- [Comparative Reflection: Prisma vs. Document Databases](#comparative-reflection-prisma-vs-document-databases)
- [Getting Started](#getting-started)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Installation](#2-installation)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Generate Prisma Client](#4-generate-prisma-client)
  - [5. Run Database Migrations](#5-run-database-migrations)
  - [6. Seed the Database](#6-seed-the-database)
  - [7. Explore with Prisma Studio](#7-explore-with-prisma-studio)
- [Prisma Service (NestJS Integration)](#prisma-service-nestjs-integration)
- [Verification & Checklist](#verification--checklist)

---

## Overview

This project implements the core data layer for a library catalog management system. It provides a strongly typed, relational database schema configured using Prisma ORM, ready to connect to local or hosted PostgreSQL instances (such as Supabase, Neon, Railway, or standard PostgreSQL).

The architecture features:
- **Role-Based Authorization Foundations**: Distinct `PATRON` and `LIBRARIAN` roles via a Prisma `enum`.
- **Normalized Relational Data Design**: Clean separation of concerns between books, genres, users, and user reviews.
- **Enterprise-Ready NestJS Integration**: A singleton `PrismaService` extending `PrismaClient` and implementing `OnModuleInit` to guarantee managed database connection lifecycles.
- **Automated Seed Script**: Comprehensive seeding mechanism populating 5 genres, 17 curated books, 3 user accounts, and initial book reviews.

---

## Project Structure

```
library-management-system/
├── api/
│   ├── .env.example              # Placeholder environment template (no secrets committed)
│   ├── .gitignore                # Ignores .env, node_modules, and build outputs
│   ├── package.json              # Dependencies, scripts, and Prisma seed configuration
│   ├── tsconfig.json             # TypeScript compiler configuration
│   ├── prisma/
│   │   ├── schema.prisma         # Declarative Prisma schema (PostgreSQL)
│   │   └── seed.ts               # Database seed script (5 genres, 17 books, users, reviews)
│   └── src/
│       └── prisma/
│           ├── prisma.service.ts # PrismaService extending PrismaClient & OnModuleInit
│           └── prisma.module.ts  # Global NestJS module exporting PrismaService
├── .gitignore                    # Root repository ignore rules
└── README.md                     # Documentation and Schema Decisions rationale
```

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    ROLE {
        enum PATRON
        enum LIBRARIAN
    }

    User ||--o{ Review : writes
    Book ||--o{ Review : receives
    Genre ||--o{ Book : categorizes

    User {
        String id PK "UUID"
        String email UK
        String name
        Role role "PATRON | LIBRARIAN"
        DateTime createdAt
        DateTime updatedAt
    }

    Genre {
        String id PK "UUID"
        String name UK
        String description
        DateTime createdAt
        DateTime updatedAt
    }

    Book {
        String id PK "UUID"
        String title
        String author
        String isbn UK
        Int publicationYear
        Int availableCopies
        String genreId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Review {
        String id PK "UUID"
        Int rating "1 - 5"
        String comment
        String bookId FK
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## Data Models

### Role Enum
Defines permissions across the application:
- `PATRON`: Standard library member capable of browsing books, checking availability, and submitting reviews.
- `LIBRARIAN`: Administrative staff with catalog maintenance, book inventory management, and circulation privileges.

```prisma
enum Role {
  PATRON
  LIBRARIAN
}
```

### User Model
Represents both library staff and patrons, linking reviews back to an authenticated profile.

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      Role     @default(PATRON)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  reviews   Review[]

  @@map("users")
}
```

### Genre Model
Acts as a centralized taxonomy entity for books. Enforces unique genre names and optional descriptions.

```prisma
model Genre {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  books       Book[]

  @@map("genres")
}
```

### Book Model
The core entity of the library catalog. Contains publication metadata, stock count, and maintains a foreign key relation to `Genre`.

```prisma
model Book {
  id              String   @id @default(uuid())
  title           String
  author          String
  isbn            String   @unique
  publicationYear Int?
  availableCopies Int      @default(1)
  genreId         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  genre           Genre    @relation(fields: [genreId], references: [id], onDelete: Cascade)
  reviews         Review[]

  @@map("books")
}
```

### Review Model (Stretch Goal)
Enables patrons to rate and comment on books. Relates both to `Book` via `bookId` and `User` via `userId`.

```prisma
model Review {
  id        String   @id @default(uuid())
  rating    Int
  comment   String?
  bookId    String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reviews")
}
```

---

## Schema Decisions

### Why Book References Genre Rather Than Embedding It

In relational database design (and specifically within PostgreSQL using Prisma), determining whether to normalize data through foreign key references (`Genre` as an independent entity referenced by `Book.genreId`) versus embedding it (e.g., storing `genre: "Science Fiction"` or a embedded sub-document) is a foundational design choice.

We deliberately decided to model `Genre` as a dedicated entity and reference it via a foreign key with `@relation`. The architectural reasons are detailed below:

#### 1. Elimination of Data Redundancy and Storage Optimization
Embedding genre data directly inside each book record leads to massive duplication. If 10,000 books belong to `"Science Fiction"`, storing the genre name and descriptive text repeatedly consumes unnecessary disk and cache space. Storing a single canonical `Genre` record and referencing it by foreign key (`genreId`) adheres strictly to relational normalization principles.

#### 2. Prevention of Update and Modification Anomalies (Third Normal Form - 3NF)
In an embedded design, if a librarian wants to correct or refine a genre name (for example, renaming `"Sci-Fi"` to `"Science Fiction"`, or updating its scope description), the application would have to locate and update thousands of individual book records. This creates severe performance overhead and risks data inconsistencies if an update fails midway. With a referenced relation:
$$\text{Single Row Update: } \mathcal{O}(1)$$
Updating a single row in the `genres` table immediately reflects across all associated books without touching the `books` table.

#### 3. Strict Referential Integrity and Typo Prevention
By enforcing a foreign key constraint (`@relation(fields: [genreId], references: [id])`), the database engine prevents orphan records and human error. Patrons and catalog managers cannot inadvertently create books with fragmented variants such as `"SciFi"`, `"scifi"`, `"Science-Fiction"`, or non-existent categories. Every book is guaranteed to point to a valid, existing genre.

#### 4. First-Class Domain Capabilities for Genres
Treating `Genre` as a distinct entity allows the library system to extend category features easily in the future, including:
- Rich descriptive summaries and curation notes.
- Physical library location metadata (e.g., floor, aisle, call number ranges).
- Taxonomy hierarchies (parent genres and sub-genres).
- Direct querying and catalog indexing of all available genres, even if some currently have zero books assigned.

#### 5. Efficient Indexing and Relational Query Performance
PostgreSQL excels at indexed joins. By indexing `genreId`, filtering books by genre (`WHERE genreId = ...`) or aggregating inventory statistics by genre (`COUNT(books) GROUP BY genreId`) is performed with high-efficiency b-tree index lookups rather than costly full-table text scans.

---

## Comparative Reflection: Prisma vs. Document Databases

> **Stretch Note:** Key operational and conceptual differences experienced when modeling in Prisma (Relational / SQL) versus a Document Database (e.g., MongoDB / Mongoose).

1. **Schema Enforcement at the Database Engine Level vs. Application Level**:
   In document databases like MongoDB, documents in a collection are inherently schema-less at the storage layer; validations are usually enforced at the application runtime (e.g., via Mongoose schemas or JSON Schema validators). In contrast, Prisma's declarative schema directly maps to strict SQL DDL constraints (`NOT NULL`, `FOREIGN KEY`, `UNIQUE`, and `CHECK` constraints) enforced directly by the PostgreSQL engine. Attempting to violate a constraint fails deterministically at the database level.

2. **Relations and Referential Integrity vs. Denormalized Embedding**:
   In document databases, the default modeling pattern often favors **embedding** related data inside parent documents (e.g., nesting an array of reviews or category tags inside a book document) to optimize for single-document reads. In Prisma with PostgreSQL, relations are modeled explicitly using foreign keys, join tables, or relation fields (`@relation`). While document databases require manual logic to clean up dangling references if a parent entity is deleted, Prisma and PostgreSQL handle integrity natively with declarative actions like `onDelete: Cascade`.

3. **Migration Discipline vs. Schema Flexibility**:
   Evolving data structures in Prisma requires creating version-tracked SQL migrations (`prisma migrate dev`), providing an auditable, deterministic migration trail across staging and production environments. Document stores allow arbitrary fields to be added on the fly, offering rapid prototyping speed at the cost of requiring legacy-document data cleanup scripts later on.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x` or `v22.x`
- **npm** or **pnpm**
- **PostgreSQL**: Local instance running on port `5432` OR a hosted database (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com), [Render](https://render.com), [Railway](https://railway.app)).

### 2. Installation
Navigate into the `api` directory and install the project dependencies:

```bash
cd api
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` inside the `api` folder:

```bash
cp .env.example .env
```

Open `.env` and set your `DATABASE_URL`:
```env
# Example connection string:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/library_db?schema=public"
```

> **Security Note:** `.env` is listed in `.gitignore` and must never be committed to source control.

### 4. Generate Prisma Client
Generate the strongly typed Prisma Client artifacts based on `schema.prisma`:

```bash
npm run prisma:generate
```

### 5. Run Database Migrations
Create and apply migrations to your PostgreSQL database:

```bash
npm run prisma:migrate
```
*(When prompted, provide a migration name such as `init_library_catalog`).*

Alternatively, to quickly synchronize the schema directly to a development database:
```bash
npm run prisma:push
```

### 6. Seed the Database
Execute the database seed script to populate genres, books, users, and reviews:

```bash
npm run prisma:seed
```

You will see output confirming insertion:
```
🌱 Starting database seed...
Seeding 5 genres...
Seeding initial users...
Seeding books...
Seeding sample reviews (Stretch Goal)...
✅ Seed completed successfully:
 - 5 Genres
 - 17 Books
 - 3 Users (1 Librarian, 2 Patrons)
 - 3 Reviews
```

### 7. Explore with Prisma Studio
Open Prisma's interactive GUI in your browser to inspect and manage your data:

```bash
npm run prisma:studio
```

---

## Prisma Service (NestJS Integration)

The application provides a clean, production-ready `PrismaService` conforming to NestJS standards located at `api/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

This service can be injected into any NestJS service or controller across the application:
```typescript
@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.book.findMany({
      include: { genre: true, reviews: true },
    });
  }
}
```

---

## Verification & Checklist

| Requirement | Target File | Status |
| :--- | :--- | :---: |
| **Role Enum (`PATRON`, `LIBRARIAN`)** | `api/prisma/schema.prisma` | ✅ |
| **User Model using `Role`** | `api/prisma/schema.prisma` | ✅ |
| **Genre Model** | `api/prisma/schema.prisma` | ✅ |
| **Book Model with `genreId` FK & `@relation`** | `api/prisma/schema.prisma` | ✅ |
| **Stretch: Review Model relation (`bookId`, `userId`, `rating`, `comment`)** | `api/prisma/schema.prisma` | ✅ |
| **Seed script with 4+ genres & 15+ books** | `api/prisma/seed.ts` (5 Genres, 17 Books) | ✅ |
| **PrismaService extends `PrismaClient` + `OnModuleInit` + `this.$connect()`** | `api/src/prisma/prisma.service.ts` | ✅ |
| **`.env.example` with `DATABASE_URL` placeholder** | `api/.env.example` | ✅ |
| **README 'Schema Decisions' section on referencing vs embedding** | `README.md` | ✅ |
| **Stretch: Reflection on Prisma vs Document Database** | `README.md` | ✅ |

