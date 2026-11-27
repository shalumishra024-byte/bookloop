import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NeonDB PostgreSQL database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Librarian User
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@college.edu' },
    update: {
      role: 'LIBRARIAN',
      librarianProfile: {
        upsert: {
          create: {
            librarianId: 'LIB-2024-001',
            designation: 'Chief University Librarian',
            libraryName: 'Central Academic Library',
            department: 'Library & Information Services',
          },
          update: {
            designation: 'Chief University Librarian',
            libraryName: 'Central Academic Library',
          },
        },
      },
    },
    create: {
      id: 'user-lib-1',
      name: 'Dr. Sarah Jenkins',
      email: 'librarian@college.edu',
      passwordHash,
      role: 'LIBRARIAN',
      isProfileComplete: true,
      librarianProfile: {
        create: {
          librarianId: 'LIB-2024-001',
          designation: 'Chief University Librarian',
          libraryName: 'Central Academic Library',
          department: 'Library & Information Services',
        },
      },
    },
  });

  // 2. Create Student User & Profile
  const student1 = await prisma.user.upsert({
    where: { email: 'alex.rivera@college.edu' },
    update: {},
    create: {
      id: 'user-stu-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@college.edu',
      passwordHash,
      role: 'STUDENT',
      isProfileComplete: true,
      studentProfile: {
        create: {
          studentId: 'CS-2024-042',
          department: 'Computer Science & Engineering',
          academicYear: '3rd Year',
          semester: '6th Semester',
          collegeAffiliation: 'School of Engineering & Technology',
          impactScore: 24,
          totalDonations: 3,
          activeBorrowingsCount: 1,
        },
      },
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'priya.sharma@college.edu' },
    update: {},
    create: {
      id: 'user-stu-2',
      name: 'Priya Sharma',
      email: 'priya.sharma@college.edu',
      passwordHash,
      role: 'STUDENT',
      isProfileComplete: true,
      studentProfile: {
        create: {
          studentId: 'EE-2024-118',
          department: 'Electrical & Electronics Engineering',
          academicYear: '2nd Year',
          semester: '4th Semester',
          collegeAffiliation: 'School of Engineering & Technology',
          impactScore: 10,
          totalDonations: 1,
          activeBorrowingsCount: 1,
        },
      },
    },
  });

  // 3. Create Books and Physical Copies
  const book1 = await prisma.book.upsert({
    where: { id: 'book-1' },
    update: {},
    create: {
      id: 'book-1',
      title: 'Introduction to Algorithms (4th Edition)',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      isbn: '978-0262046305',
      category: 'Computer Science',
      description: 'A comprehensive textbook and standard reference on modern computer algorithms covering data structures, dynamic programming, and greedy algorithms.',
      totalCopies: 4,
      availableCopies: 2,
      coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=600',
      source: 'LIBRARY',
      status: 'AVAILABLE',
      copies: {
        create: [
          { id: 'copy-1-1', copyNumber: 'CL-CS-001A', status: 'AVAILABLE', condition: 'EXCELLENT' },
          { id: 'copy-1-2', copyNumber: 'CL-CS-001B', status: 'AVAILABLE', condition: 'GOOD' },
          { id: 'copy-1-3', copyNumber: 'CL-CS-001C', status: 'RESERVED', condition: 'GOOD' },
          { id: 'copy-1-4', copyNumber: 'CL-CS-001D', status: 'ISSUED', condition: 'ACCEPTABLE' },
        ],
      },
    },
  });

  const book2 = await prisma.book.upsert({
    where: { id: 'book-2' },
    update: {},
    create: {
      id: 'book-2',
      title: 'Operating System Concepts (10th Edition)',
      author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
      isbn: '978-1119456339',
      category: 'Computer Science',
      description: 'Fundamental principles of operating systems including processes, threads, memory management, file systems, and distributed systems.',
      totalCopies: 3,
      availableCopies: 0,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      source: 'LIBRARY',
      status: 'UNAVAILABLE',
      copies: {
        create: [
          { id: 'copy-2-1', copyNumber: 'CL-CS-002A', status: 'ISSUED', condition: 'EXCELLENT' },
          { id: 'copy-2-2', copyNumber: 'CL-CS-002B', status: 'ISSUED', condition: 'GOOD' },
          { id: 'copy-2-3', copyNumber: 'CL-CS-002C', status: 'ISSUED', condition: 'GOOD' },
        ],
      },
    },
  });

  const book3 = await prisma.book.upsert({
    where: { id: 'book-3' },
    update: {},
    create: {
      id: 'book-3',
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      isbn: '978-0201633610',
      category: 'Software Engineering',
      description: 'The landmark book detailing 23 classic design patterns in software architecture and engineering.',
      totalCopies: 2,
      availableCopies: 1,
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
      source: 'DONATION',
      donorName: 'Alex Rivera',
      status: 'AVAILABLE',
      copies: {
        create: [
          { id: 'copy-3-1', copyNumber: 'CL-SE-003A', status: 'AVAILABLE', condition: 'EXCELLENT' },
          { id: 'copy-3-2', copyNumber: 'CL-SE-003B', status: 'ISSUED', condition: 'GOOD' },
        ],
      },
    },
  });

  const book4 = await prisma.book.upsert({
    where: { id: 'book-4' },
    update: {},
    create: {
      id: 'book-4',
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James Kurose, Keith Ross',
      isbn: '978-0136681557',
      category: 'Networking',
      description: 'Premier textbook on computer networking structured from the application layer down to the physical layer.',
      totalCopies: 3,
      availableCopies: 3,
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600',
      source: 'LIBRARY',
      status: 'AVAILABLE',
      copies: {
        create: [
          { id: 'copy-4-1', copyNumber: 'CL-NET-004A', status: 'AVAILABLE', condition: 'EXCELLENT' },
          { id: 'copy-4-2', copyNumber: 'CL-NET-004B', status: 'AVAILABLE', condition: 'EXCELLENT' },
          { id: 'copy-4-3', copyNumber: 'CL-NET-004C', status: 'AVAILABLE', condition: 'GOOD' },
        ],
      },
    },
  });

  // 4. Create Initial Borrow Request
  await prisma.borrowRequest.upsert({
    where: { id: 'req-1' },
    update: {},
    create: {
      id: 'req-1',
      studentId: 'user-stu-1',
      bookId: 'book-1',
      bookCopyId: 'copy-1-3',
      status: 'ACCEPTED',
      pickupWindowHours: 48,
      pickupDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      impactScoreAtRequest: 24,
    },
  });

  // 5. Create Initial Borrow Transaction
  await prisma.borrowTransaction.upsert({
    where: { id: 'trans-1' },
    update: {},
    create: {
      id: 'trans-1',
      requestId: 'req-1',
      studentId: 'user-stu-1',
      bookCopyId: 'copy-1-4',
      issueDate: new Date(),
      expectedReturnDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      status: 'ISSUED',
    },
  });

  // 6. Create Initial Waiting Queue entries for unavailable Book 2
  await prisma.queueEntry.upsert({
    where: { id: 'q-1' },
    update: {},
    create: {
      id: 'q-1',
      studentId: 'user-stu-1',
      bookId: 'book-2',
      queuePosition: 1,
      requestTimestamp: new Date(Date.now() - 3600 * 1000),
      impactScoreSnapshot: 24,
      status: 'WAITING',
    },
  });

  await prisma.queueEntry.upsert({
    where: { id: 'q-2' },
    update: {},
    create: {
      id: 'q-2',
      studentId: 'user-stu-2',
      bookId: 'book-2',
      queuePosition: 2,
      requestTimestamp: new Date(Date.now() - 7200 * 1000),
      impactScoreSnapshot: 10,
      status: 'WAITING',
    },
  });

  // 7. Create Single Identifiable Demo Donation Request (idempotent upsert)
  await prisma.donationRequest.upsert({
    where: { id: 'don-demo-1' },
    update: {},
    create: {
      id: 'don-demo-1',
      studentId: 'user-stu-1',
      title: 'Data Structures and Algorithms',
      author: 'Reema Thareja',
      isbn: '978-0198099307',
      category: 'Computer Science',
      description: '[DEMO RECORD] Well-maintained paperback copy with clean pages, minimal pencil highlights on chapter 3, and intact spine.',
      condition: 'GOOD',
      studentQualityRating: 7,
      suggestedPoints: 7,
      images: [
        'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
      ],
      status: 'PENDING',
      isDemo: true,
    },
  });

  console.log('NeonDB seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
