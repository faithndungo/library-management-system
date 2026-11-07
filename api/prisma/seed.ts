import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Genres (at least 4 required, seeding 5)
  const genresData = [
    {
      name: 'Science Fiction',
      description: 'Speculative fiction exploring futuristic concepts, space exploration, and advanced technology.',
    },
    {
      name: 'Fantasy',
      description: 'Stories set in magical universes with mythical creatures, epic quests, and supernatural phenomena.',
    },
    {
      name: 'Mystery & Thriller',
      description: 'Suspenseful investigations, puzzles, crime mysteries, and psychological tension.',
    },
    {
      name: 'Historical Fiction',
      description: 'Narratives set in recognized historical periods capturing the spirit and events of past eras.',
    },
    {
      name: 'Non-Fiction',
      description: 'Informative works based on real-world facts, science, biography, and personal development.',
    },
  ];

  console.log(`Seeding ${genresData.length} genres...`);
  const genresMap: Record<string, string> = {};

  for (const genre of genresData) {
    const record = await prisma.genre.upsert({
      where: { name: genre.name },
      update: { description: genre.description },
      create: genre,
    });
    genresMap[genre.name] = record.id;
  }

  // 2. Seed Users (with Role enum: PATRON, LIBRARIAN)
  console.log('Seeding initial users...');
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.org' },
    update: {},
    create: {
      email: 'librarian@library.org',
      name: 'Sarah Jenkins',
      role: Role.LIBRARIAN,
    },
  });

  const patronAlice = await prisma.user.upsert({
    where: { email: 'alice.patron@example.com' },
    update: {},
    create: {
      email: 'alice.patron@example.com',
      name: 'Alice Johnson',
      role: Role.PATRON,
    },
  });

  const patronBob = await prisma.user.upsert({
    where: { email: 'bob.patron@example.com' },
    update: {},
    create: {
      email: 'bob.patron@example.com',
      name: 'Bob Martinez',
      role: Role.PATRON,
    },
  });

  // 3. Seed Books (at least 15 required, seeding 17 distributed across the 5 genres)
  console.log('Seeding books...');
  const booksData = [
    // Science Fiction
    {
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '978-0441172719',
      publicationYear: 1965,
      availableCopies: 4,
      genreName: 'Science Fiction',
    },
    {
      title: 'Neuromancer',
      author: 'William Gibson',
      isbn: '978-0441569595',
      publicationYear: 1984,
      availableCopies: 3,
      genreName: 'Science Fiction',
    },
    {
      title: 'Foundation',
      author: 'Isaac Asimov',
      isbn: '978-0553293357',
      publicationYear: 1951,
      availableCopies: 2,
      genreName: 'Science Fiction',
    },
    {
      title: 'Snow Crash',
      author: 'Neal Stephenson',
      isbn: '978-0553380958',
      publicationYear: 1992,
      availableCopies: 3,
      genreName: 'Science Fiction',
    },

    // Fantasy
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '978-0547928227',
      publicationYear: 1937,
      availableCopies: 5,
      genreName: 'Fantasy',
    },
    {
      title: 'A Game of Thrones',
      author: 'George R.R. Martin',
      isbn: '978-0553103540',
      publicationYear: 1996,
      availableCopies: 4,
      genreName: 'Fantasy',
    },
    {
      title: 'The Name of the Wind',
      author: 'Patrick Rothfuss',
      isbn: '978-0756404741',
      publicationYear: 2007,
      availableCopies: 3,
      genreName: 'Fantasy',
    },
    {
      title: 'The Way of Kings',
      author: 'Brandon Sanderson',
      isbn: '978-0765326355',
      publicationYear: 2010,
      availableCopies: 2,
      genreName: 'Fantasy',
    },

    // Mystery & Thriller
    {
      title: 'The Da Vinci Code',
      author: 'Dan Brown',
      isbn: '978-0307474278',
      publicationYear: 2003,
      availableCopies: 6,
      genreName: 'Mystery & Thriller',
    },
    {
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      isbn: '978-0307588371',
      publicationYear: 2012,
      availableCopies: 4,
      genreName: 'Mystery & Thriller',
    },
    {
      title: 'The Girl with the Dragon Tattoo',
      author: 'Stieg Larsson',
      isbn: '978-0307454546',
      publicationYear: 2005,
      availableCopies: 3,
      genreName: 'Mystery & Thriller',
    },
    {
      title: 'And Then There Were None',
      author: 'Agatha Christie',
      isbn: '978-0062073488',
      publicationYear: 1939,
      availableCopies: 5,
      genreName: 'Mystery & Thriller',
    },

    // Historical Fiction
    {
      title: 'The Book Thief',
      author: 'Markus Zusak',
      isbn: '978-0375842207',
      publicationYear: 2005,
      availableCopies: 4,
      genreName: 'Historical Fiction',
    },
    {
      title: 'All the Light We Cannot See',
      author: 'Anthony Doerr',
      isbn: '978-1476746586',
      publicationYear: 2014,
      availableCopies: 3,
      genreName: 'Historical Fiction',
    },
    {
      title: 'The Pillars of the Earth',
      author: 'Ken Follett',
      isbn: '978-0451166890',
      publicationYear: 1989,
      availableCopies: 2,
      genreName: 'Historical Fiction',
    },

    // Non-Fiction
    {
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      isbn: '978-0062316097',
      publicationYear: 2014,
      availableCopies: 5,
      genreName: 'Non-Fiction',
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '978-0735211292',
      publicationYear: 2018,
      availableCopies: 7,
      genreName: 'Non-Fiction',
    },
  ];

  const seededBooks: Record<string, string> = {};

  for (const b of booksData) {
    const genreId = genresMap[b.genreName];
    const book = await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {
        title: b.title,
        author: b.author,
        publicationYear: b.publicationYear,
        availableCopies: b.availableCopies,
        genreId: genreId,
      },
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        publicationYear: b.publicationYear,
        availableCopies: b.availableCopies,
        genreId: genreId,
      },
    });
    seededBooks[book.title] = book.id;
  }

  // 4. Seed Reviews (Stretch Goal)
  console.log('Seeding sample reviews (Stretch Goal)...');
  const duneId = seededBooks['Dune'];
  const habitsId = seededBooks['Atomic Habits'];
  const hobbitId = seededBooks['The Hobbit'];

  if (duneId && patronAlice) {
    const existingReview = await prisma.review.findFirst({
      where: { bookId: duneId, userId: patronAlice.id },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          bookId: duneId,
          userId: patronAlice.id,
          rating: 5,
          comment: 'An epic masterpiece of world-building and galactic politics.',
        },
      });
    }
  }

  if (habitsId && patronBob) {
    const existingReview = await prisma.review.findFirst({
      where: { bookId: habitsId, userId: patronBob.id },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          bookId: habitsId,
          userId: patronBob.id,
          rating: 5,
          comment: 'Incredibly actionable and practical strategies for behavior change.',
        },
      });
    }
  }

  if (hobbitId && patronAlice) {
    const existingReview = await prisma.review.findFirst({
      where: { bookId: hobbitId, userId: patronAlice.id },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          bookId: hobbitId,
          userId: patronAlice.id,
          rating: 4,
          comment: 'A charming, timeless adventure into Middle-earth.',
        },
      });
    }
  }

  console.log('✅ Seed completed successfully:');
  console.log(` - ${genresData.length} Genres`);
  console.log(` - ${booksData.length} Books`);
  console.log(` - 3 Users (1 Librarian, 2 Patrons)`);
  console.log(` - 3 Reviews`);
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

