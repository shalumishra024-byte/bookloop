import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, BookCondition, BookSource, BookStatus, BorrowRequestStatus, BorrowTransactionStatus, CopyStatus, QueueStatus, UserRole } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken, requireRole } from './middleware/auth.middleware.js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bookloop-neon-secret-jwt-key-2026';

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/+$/, '');
    if (allowedOrigins.includes('*') || allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'NeonDB PostgreSQL (Connected)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL || 'https://ep-morning-sea-bdolwkuy.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth';

/**
 * Verifies a Neon Managed Better Auth session token directly with Neon Auth.
 * Returns the verified user { id, email, name } or null if invalid.
 */
async function verifyNeonAuthSession(token: string): Promise<{ id: string; email: string; name?: string } | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${NEON_AUTH_BASE_URL}/get-session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { id: string; email: string; name?: string } };
    if (data?.user?.id && data?.user?.email) {
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, neonToken, intendedRole } = req.body;
    let verifiedNeonUser: { id: string; email: string; name?: string } | null = null;

    if (neonToken) {
      verifiedNeonUser = await verifyNeonAuthSession(neonToken);
    }

    const lookupEmail = (verifiedNeonUser?.email || email || '').toLowerCase().trim();
    if (!lookupEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Look up user by verified Neon user ID first, then by email
    let user = verifiedNeonUser?.id
      ? await prisma.user.findUnique({
          where: { id: verifiedNeonUser.id },
          include: { studentProfile: true, librarianProfile: true },
        })
      : null;

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: lookupEmail },
        include: { studentProfile: true, librarianProfile: true },
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or account not found' });
    }

    // Require either a verified Neon Auth session OR a valid bcrypt password match
    if (!verifiedNeonUser) {
      if (!password || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    // Verify selected login role against the authoritative database role
    if (intendedRole) {
      const normalizedIntended = String(intendedRole).toUpperCase();
      if (normalizedIntended !== 'STUDENT' && normalizedIntended !== 'LIBRARIAN') {
        return res.status(400).json({ error: 'Invalid role selection' });
      }
      if (user.role !== normalizedIntended) {
        return res.status(403).json({
          error:
            normalizedIntended === 'LIBRARIAN'
              ? 'Access denied: This account does not have Librarian privileges.'
              : 'Role mismatch: Please select Librarian to sign in with an authority account.',
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
      profile: user.role === 'STUDENT' ? user.studentProfile : null,
      librarianProfile: user.role === 'LIBRARIAN' ? user.librarianProfile : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Neon Auth Sync (OAuth / verified Neon session only; never assigns LIBRARIAN role)
app.post('/api/auth/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.split(' ')[1];
    const neonToken = req.body.neonToken || bearerToken;

    const verifiedNeonUser = await verifyNeonAuthSession(neonToken);
    if (!verifiedNeonUser) {
      return res.status(401).json({ error: 'Unauthorized: Valid Neon Auth session required' });
    }

    const normalizedEmail = verifiedNeonUser.email.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: verifiedNeonUser.id }, { email: normalizedEmail }],
      },
      include: { studentProfile: true, librarianProfile: true },
    });

    if (!user) {
      // New accounts via public OAuth/sync ALWAYS receive STUDENT role
      user = await prisma.user.create({
        data: {
          id: verifiedNeonUser.id,
          email: normalizedEmail,
          name: verifiedNeonUser.name || normalizedEmail.split('@')[0],
          role: 'STUDENT',
          isProfileComplete: false,
        },
        include: { studentProfile: true, librarianProfile: true },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
      profile: user.role === 'STUDENT' ? user.studentProfile : null,
      librarianProfile: user.role === 'LIBRARIAN' ? user.librarianProfile : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, studentId, department, academicYear, semester, collegeAffiliation, neonUserId, role: requestedRole } = req.body;

    // Reject any attempt to self-assign a privileged role during public signup
    if (requestedRole && String(requestedRole).toUpperCase() !== 'STUDENT') {
      return res.status(403).json({ error: 'Forbidden: Privileged roles cannot be selected during public registration' });
    }

    if (!fullName || !email || !studentId) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { studentProfile: true },
    });

    if (user && user.role === 'LIBRARIAN') {
      return res.status(403).json({ error: 'Forbidden: Cannot overwrite an administrative account' });
    }

    if (user && user.studentProfile) {
      return res.status(400).json({ error: 'An account with this college email already exists' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    if (user) {
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          studentId,
          department: department || 'Computer Science & Engineering',
          academicYear: academicYear || '1st Year',
          semester: semester || '1st Semester',
          collegeAffiliation: collegeAffiliation || 'College Campus',
        },
        create: {
          userId: user.id,
          studentId,
          department: department || 'Computer Science & Engineering',
          academicYear: academicYear || '1st Year',
          semester: semester || '1st Semester',
          collegeAffiliation: collegeAffiliation || 'College Campus',
          impactScore: 0,
          totalDonations: 0,
          activeBorrowingsCount: 0,
        },
      });

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          role: 'STUDENT', // Guaranteed student role on signup
          isProfileComplete: true,
          ...(passwordHash ? { passwordHash } : {}),
        },
        include: { studentProfile: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          id: neonUserId || undefined,
          name: fullName,
          email: normalizedEmail,
          passwordHash,
          role: 'STUDENT', // Guaranteed student role on signup
          isProfileComplete: true,
          studentProfile: {
            create: {
              studentId,
              department: department || 'Computer Science & Engineering',
              academicYear: academicYear || '1st Year',
              semester: semester || '1st Semester',
              collegeAffiliation: collegeAffiliation || 'College Campus',
              impactScore: 0,
              totalDonations: 0,
              activeBorrowingsCount: 0,
            },
          },
        },
        include: { studentProfile: true },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
      profile: user.studentProfile,
      librarianProfile: null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { studentProfile: true, librarianProfile: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
      profile: user.role === 'STUDENT' ? user.studentProfile : null,
      librarianProfile: user.role === 'LIBRARIAN' ? user.librarianProfile : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Student Profile (strictly owner-only, never allows role or impactScore changes)
app.put('/api/auth/profile/:id', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if ('role' in req.body || 'impactScore' in req.body || 'totalDonations' in req.body || 'activeBorrowingsCount' in req.body) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify role or privileged account fields' });
    }

    const existingProfile = await prisma.studentProfile.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProfile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    if (existingProfile.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
    }

    const { studentId, department, academicYear, semester, collegeAffiliation } = req.body;
    const updated = await prisma.studentProfile.update({
      where: { id: req.params.id },
      data: {
        studentId,
        department,
        academicYear,
        semester,
        collegeAffiliation,
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Librarian Profile (strictly LIBRARIAN owner-only, never allows role changes)
app.put('/api/auth/librarian-profile', authenticateToken, requireRole(['LIBRARIAN']), async (req: AuthenticatedRequest, res) => {
  try {
    if ('role' in req.body) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify role via profile update' });
    }

    const { designation, libraryName, department } = req.body;
    const updated = await prisma.librarianProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        designation,
        libraryName,
        department,
      },
      create: {
        userId: req.user!.id,
        librarianId: `LIB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        designation: designation || 'University Librarian',
        libraryName: libraryName || 'Central Academic Library',
        department: department || 'Library & Information Services',
      },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Server-Side Librarian Provisioning (only callable by an existing LIBRARIAN)
app.post('/api/admin/librarians', authenticateToken, requireRole(['LIBRARIAN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, name, password, librarianId, designation, libraryName, department } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    const librarian = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        role: 'LIBRARIAN',
        name,
        ...(passwordHash ? { passwordHash } : {}),
      },
      create: {
        email: normalizedEmail,
        name,
        passwordHash,
        role: 'LIBRARIAN',
        isProfileComplete: true,
      },
    });

    const profile = await prisma.librarianProfile.upsert({
      where: { userId: librarian.id },
      update: {
        designation: designation || 'University Librarian',
        libraryName: libraryName || 'Central Academic Library',
        department: department || 'Library & Information Services',
      },
      create: {
        userId: librarian.id,
        librarianId: librarianId || `LIB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        designation: designation || 'University Librarian',
        libraryName: libraryName || 'Central Academic Library',
        department: department || 'Library & Information Services',
      },
    });

    res.status(201).json({
      user: {
        id: librarian.id,
        name: librarian.name,
        email: librarian.email,
        role: librarian.role,
      },
      librarianProfile: profile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOOKS CATALOG ---
app.get('/api/books', async (req, res) => {
  try {
    const { search, category, status, source } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { author: { contains: String(search), mode: 'insensitive' } },
        { category: { contains: String(search), mode: 'insensitive' } },
        { isbn: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'ALL') {
      where.category = { equals: String(category), mode: 'insensitive' };
    }
    if (status && status !== 'ALL') {
      where.status = status as BookStatus;
    }
    if (source && source !== 'ALL') {
      where.source = source as BookSource;
    }

    const books = await prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { copies: true },
    });
    res.json(books);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: { copies: true },
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books/:id/copies', async (req, res) => {
  try {
    const copies = await prisma.bookCopy.findMany({
      where: { bookId: req.params.id },
      orderBy: { copyNumber: 'asc' },
    });
    res.json(copies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const { title, author, isbn, category, description, totalCopies = 1, coverImage, source = 'LIBRARY' } = req.body;
    const copiesCount = Number(totalCopies) || 1;

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        category,
        description,
        totalCopies: copiesCount,
        availableCopies: copiesCount,
        coverImage,
        source: source as BookSource,
        status: 'AVAILABLE',
      },
    });

    // Generate physical copy records
    const copyData = [];
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'GEN';
    for (let i = 1; i <= copiesCount; i++) {
      copyData.push({
        bookId: book.id,
        copyNumber: `CL-${prefix}-${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(64 + i)}`,
        status: 'AVAILABLE' as CopyStatus,
        condition: 'EXCELLENT' as BookCondition,
      });
    }

    await prisma.bookCopy.createMany({ data: copyData });
    const fullBook = await prisma.book.findUnique({ where: { id: book.id }, include: { copies: true } });
    res.status(201).json(fullBook);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BORROW REQUESTS & CIRCULATION ---
app.get('/api/borrow/requests', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, status } = req.query;
    const where: any = {};
    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.id;
    } else if (studentId) {
      where.studentId = String(studentId);
    }
    if (status && status !== 'ALL') where.status = status as BorrowRequestStatus;

    const requests = await prisma.borrowRequest.findMany({
      where,
      orderBy: { requestDate: 'desc' },
      include: {
        student: { select: { name: true, email: true, studentProfile: { select: { studentId: true } } } },
        book: { select: { title: true, author: true } },
        copy: { select: { copyNumber: true } },
      },
    });

    const formatted = requests.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.name,
      studentEmail: r.student.email,
      studentRollNo: r.student.studentProfile?.studentId || 'N/A',
      bookId: r.bookId,
      bookTitle: r.book.title,
      bookAuthor: r.book.author,
      bookCopyId: r.bookCopyId || undefined,
      copyNumber: r.copy?.copyNumber || undefined,
      requestDate: r.requestDate.toISOString(),
      status: r.status,
      pickupDeadline: r.pickupDeadline ? r.pickupDeadline.toISOString() : undefined,
      pickupWindowHours: r.pickupWindowHours,
      impactScoreAtRequest: r.impactScoreAtRequest,
      librarianNotes: r.librarianNotes || undefined,
      reviewDate: r.reviewDate ? r.reviewDate.toISOString() : undefined,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrow/requests', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const { bookId } = req.body;
    const studentId = req.user!.id;
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'No copies available. Join the waiting queue instead!' });
    }

    const existing = await prisma.borrowRequest.findFirst({
      where: {
        bookId,
        studentId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active request for this book.' });
    }

    const profile = await prisma.studentProfile.findFirst({ where: { userId: studentId } });
    const impactScore = profile?.impactScore || 0;

    const request = await prisma.borrowRequest.create({
      data: {
        bookId,
        studentId,
        status: 'PENDING',
        impactScoreAtRequest: impactScore,
      },
    });

    res.status(201).json({ success: true, message: 'Borrowing request submitted to librarian!', request });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/borrow/requests/:id/accept', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const { pickupWindowHours = 48, notes } = req.body;
    const borrowReq = await prisma.borrowRequest.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });
    if (!borrowReq || borrowReq.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Find available physical copy in database
    const availableCopy = await prisma.bookCopy.findFirst({
      where: { bookId: borrowReq.bookId, status: 'AVAILABLE' },
    });
    if (!availableCopy) {
      return res.status(400).json({ error: 'No physical copies available to reserve' });
    }

    const pickupDeadline = new Date(Date.now() + Number(pickupWindowHours) * 3600 * 1000);

    // Atomically reserve copy and update book availableCopies
    await prisma.$transaction([
      prisma.bookCopy.update({
        where: { id: availableCopy.id },
        data: { status: 'RESERVED' },
      }),
      prisma.book.update({
        where: { id: borrowReq.bookId },
        data: {
          availableCopies: { decrement: 1 },
          status: borrowReq.book.availableCopies - 1 <= 0 ? 'UNAVAILABLE' : 'AVAILABLE',
        },
      }),
      prisma.borrowRequest.update({
        where: { id: borrowReq.id },
        data: {
          status: 'ACCEPTED',
          bookCopyId: availableCopy.id,
          pickupDeadline,
          pickupWindowHours: Number(pickupWindowHours),
          librarianNotes: notes,
          reviewDate: new Date(),
        },
      }),
    ]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrow/requests/:id/reject', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const { notes } = req.body;
    await prisma.borrowRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        librarianNotes: notes,
        reviewDate: new Date(),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrow/requests/:id/cancel', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const reqItem = await prisma.borrowRequest.findUnique({ where: { id: req.params.id } });
    if (!reqItem || reqItem.studentId !== studentId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (reqItem.status === 'ACCEPTED' && reqItem.bookCopyId) {
      // Free the copy
      await prisma.$transaction([
        prisma.bookCopy.update({ where: { id: reqItem.bookCopyId }, data: { status: 'AVAILABLE' } }),
        prisma.book.update({ where: { id: reqItem.bookId }, data: { availableCopies: { increment: 1 }, status: 'AVAILABLE' } }),
        prisma.borrowRequest.update({ where: { id: reqItem.id }, data: { status: 'CANCELLED' } }),
      ]);
    } else {
      await prisma.borrowRequest.update({ where: { id: reqItem.id }, data: { status: 'CANCELLED' } });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrow/requests/:id/issue', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const { borrowDurationDays = 14 } = req.body;
    const reqItem = await prisma.borrowRequest.findUnique({
      where: { id: req.params.id },
      include: { copy: true, book: true, student: true },
    });

    if (!reqItem || reqItem.status !== 'ACCEPTED' || !reqItem.bookCopyId) {
      return res.status(400).json({ error: 'Request is not ready to be issued' });
    }

    const expectedReturnDate = new Date(Date.now() + Number(borrowDurationDays) * 24 * 3600 * 1000);

    await prisma.$transaction([
      prisma.bookCopy.update({
        where: { id: reqItem.bookCopyId },
        data: { status: 'ISSUED' },
      }),
      prisma.borrowRequest.update({
        where: { id: reqItem.id },
        data: { status: 'COMPLETED' },
      }),
      prisma.borrowTransaction.create({
        data: {
          requestId: reqItem.id,
          studentId: reqItem.studentId,
          bookCopyId: reqItem.bookCopyId,
          issueDate: new Date(),
          expectedReturnDate,
          status: 'ISSUED',
        },
      }),
      prisma.studentProfile.updateMany({
        where: { userId: reqItem.studentId },
        data: { activeBorrowingsCount: { increment: 1 } },
      }),
    ]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TRANSACTIONS & RETURN WORKFLOW ---
app.get('/api/borrow/transactions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, status } = req.query;
    const where: any = {};
    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.id;
    } else if (studentId) {
      where.studentId = String(studentId);
    }
    if (status && status !== 'ALL') where.status = status as BorrowTransactionStatus;

    const txs = await prisma.borrowTransaction.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      include: {
        student: { select: { name: true } },
        copy: { include: { book: { select: { id: true, title: true } } } },
      },
    });

    const formatted = txs.map(t => ({
      id: t.id,
      requestId: t.requestId,
      studentId: t.studentId,
      studentName: t.student.name,
      bookId: t.copy.book.id,
      bookTitle: t.copy.book.title,
      bookCopyId: t.bookCopyId,
      copyNumber: t.copy.copyNumber,
      issueDate: t.issueDate.toISOString(),
      expectedReturnDate: t.expectedReturnDate.toISOString(),
      actualReturnDate: t.actualReturnDate ? t.actualReturnDate.toISOString() : undefined,
      status: t.status,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/borrow/transactions/:id/return', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const tx = await prisma.borrowTransaction.findUnique({
      where: { id: req.params.id },
      include: { copy: { include: { book: true } } },
    });

    if (!tx || tx.status !== 'ISSUED') {
      return res.status(400).json({ error: 'Transaction is not active' });
    }

    const bookId = tx.copy.bookId;

    // Atomically mark returned, free copy, update student active count
    await prisma.$transaction([
      prisma.borrowTransaction.update({
        where: { id: tx.id },
        data: { status: 'RETURNED', actualReturnDate: new Date() },
      }),
      prisma.bookCopy.update({
        where: { id: tx.bookCopyId },
        data: { status: 'AVAILABLE' },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { availableCopies: { increment: 1 }, status: 'AVAILABLE' },
      }),
      prisma.studentProfile.updateMany({
        where: { userId: tx.studentId },
        data: { activeBorrowingsCount: { decrement: 1 } },
      }),
    ]);

    // Check waiting queue for this book and assign to top priority student!
    const topQueued = await prisma.queueEntry.findFirst({
      where: { bookId, status: 'WAITING' },
      orderBy: [
        { impactScoreSnapshot: 'desc' },
        { requestTimestamp: 'asc' },
      ],
      include: { student: { select: { id: true, studentProfile: { select: { impactScore: true } } } } },
    });

    if (topQueued) {
      await prisma.queueEntry.update({
        where: { id: topQueued.id },
        data: { status: 'OFFERED' },
      });

      // Auto-create accepted request with 24h pickup window
      const copyToReserve = await prisma.bookCopy.findFirst({
        where: { bookId, status: 'AVAILABLE' },
      });
      if (copyToReserve) {
        await prisma.$transaction([
          prisma.bookCopy.update({
            where: { id: copyToReserve.id },
            data: { status: 'RESERVED' },
          }),
          prisma.book.update({
            where: { id: bookId },
            data: { availableCopies: { decrement: 1 } },
          }),
          prisma.borrowRequest.create({
            data: {
              bookId,
              studentId: topQueued.studentId,
              bookCopyId: copyToReserve.id,
              status: 'ACCEPTED',
              pickupWindowHours: 24,
              pickupDeadline: new Date(Date.now() + 24 * 3600 * 1000),
              impactScoreAtRequest: topQueued.impactScoreSnapshot,
              librarianNotes: 'Auto-allocated from Waiting Queue (Priority #1)',
            },
          }),
        ]);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DONATIONS & IMPACT SCORE ---
app.get('/api/donations', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { studentId, status } = req.query;
    const where: any = {};
    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.id;
    } else if (studentId) {
      where.studentId = String(studentId);
    }
    if (status && status !== 'ALL') where.status = status as any;

    const donations = await prisma.donationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true, email: true } } },
    });

    const formatted = donations.map(d => ({
      id: d.id,
      studentId: d.studentId,
      studentName: d.student.name,
      studentEmail: d.student.email,
      title: d.title,
      author: d.author,
      isbn: d.isbn || undefined,
      category: d.category || undefined,
      description: d.description,
      condition: d.condition,
      studentQualityRating: d.studentQualityRating,
      verifiedQualityRating: d.verifiedQualityRating ?? undefined,
      suggestedPoints: d.suggestedPoints,
      images: d.images,
      status: d.status,
      pointsAwarded: d.pointsAwarded ?? undefined,
      librarianNotes: d.librarianNotes || undefined,
      isDemo: d.isDemo,
      createdAt: d.createdAt.toISOString(),
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : undefined,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donations', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    if ('verifiedQualityRating' in req.body || 'pointsAwarded' in req.body) {
      return res.status(403).json({ error: 'Forbidden: Only a Librarian can assign verified quality ratings or final impact points.' });
    }

    const { title, author, isbn, category, description, condition, images, studentQualityRating } = req.body;
    const studentId = req.user!.id;

    const defaultByCondition: Record<string, number> = { EXCELLENT: 10, GOOD: 7, ACCEPTABLE: 4 };
    const rawRating = studentQualityRating !== undefined ? Number(studentQualityRating) : (defaultByCondition[condition] || 7);
    const clampedRating = Math.min(10, Math.max(1, Math.round(isNaN(rawRating) ? 7 : rawRating)));

    const donation = await prisma.donationRequest.create({
      data: {
        studentId,
        title,
        author,
        isbn,
        category,
        description,
        condition: condition as BookCondition,
        studentQualityRating: clampedRating,
        suggestedPoints: clampedRating, // Suggested only; final points awarded solely upon Librarian approval
        images: images || [],
        status: 'PENDING',
      },
    });
    res.status(201).json(donation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donations/:id/approve', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const { verifiedCondition = 'EXCELLENT', verifiedQualityRating, notes, targetCategory } = req.body;
    const donation = await prisma.donationRequest.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });
    if (!donation || donation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Donation request is not pending' });
    }

    const pointsMap: Record<string, number> = { EXCELLENT: 10, GOOD: 7, ACCEPTABLE: 4 };
    const rawVerified = verifiedQualityRating !== undefined
      ? Number(verifiedQualityRating)
      : (pointsMap[verifiedCondition] || donation.studentQualityRating || 7);
    const finalRating = Math.min(10, Math.max(1, Math.round(isNaN(rawVerified) ? 7 : rawVerified)));
    const points = finalRating; // Final impact points derive strictly from Librarian's verified quality rating (1-10)
    const category = targetCategory || donation.category || 'General';

    // Atomic transaction:
    // 1. Mark donation approved with Librarian's verified quality rating and final points
    // 2. Increase student's Impact Score and totalDonations
    // 3. Create Book in catalog with source: DONATION
    // 4. Create BookCopy
    // 5. Create ImpactScoreTransaction audit record
    await prisma.$transaction(async (tx) => {
      await tx.donationRequest.update({
        where: { id: donation.id },
        data: {
          status: 'APPROVED',
          condition: verifiedCondition as BookCondition,
          verifiedQualityRating: finalRating,
          pointsAwarded: points,
          librarianNotes: notes,
          reviewedAt: new Date(),
        },
      });

      const profile = await tx.studentProfile.findFirst({ where: { userId: donation.studentId } });
      if (profile) {
        await tx.studentProfile.update({
          where: { id: profile.id },
          data: {
            impactScore: { increment: points },
            totalDonations: { increment: 1 },
          },
        });

        await tx.impactScoreTransaction.create({
          data: {
            studentProfileId: profile.id,
            donationRequestId: donation.id,
            pointsAwarded: points,
            reason: `Approved book donation: ${donation.title} (Verified Rating: ${finalRating}/10, ${verifiedCondition})`,
          },
        });
      }

      const newBook = await tx.book.create({
        data: {
          title: donation.title,
          author: donation.author,
          isbn: donation.isbn,
          category,
          description: donation.description,
          totalCopies: 1,
          availableCopies: 1,
          coverImage: donation.images[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
          source: 'DONATION',
          donorName: donation.student.name,
          status: 'AVAILABLE',
        },
      });

      await tx.bookCopy.create({
        data: {
          bookId: newBook.id,
          copyNumber: `CL-DON-${Math.floor(100 + Math.random() * 900)}A`,
          status: 'AVAILABLE',
          condition: verifiedCondition as BookCondition,
        },
      });
    });

    res.json({ success: true, verifiedQualityRating: finalRating, pointsAwarded: points });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/donations/:id/reject', authenticateToken, requireRole(['LIBRARIAN']), async (req, res) => {
  try {
    const { notes, verifiedQualityRating } = req.body;
    const rawVerified = verifiedQualityRating !== undefined ? Number(verifiedQualityRating) : undefined;
    const finalRating = rawVerified !== undefined && !isNaN(rawVerified)
      ? Math.min(10, Math.max(1, Math.round(rawVerified)))
      : undefined;

    await prisma.donationRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        pointsAwarded: 0,
        ...(finalRating !== undefined ? { verifiedQualityRating: finalRating } : {}),
        librarianNotes: notes,
        reviewedAt: new Date(),
      },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- WAITING QUEUE (CONCURRENCY-SAFE PRIORITY ENGINE) ---
// Sorting formula:
// Primary: impactScoreSnapshot DESC
// Secondary: requestTimestamp ASC
app.get('/api/queue', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { bookId } = req.query;
    const where: any = { status: 'WAITING' };
    if (bookId) where.bookId = String(bookId);

    const entries = await prisma.queueEntry.findMany({
      where,
      orderBy: [
        { impactScoreSnapshot: 'desc' },
        { requestTimestamp: 'asc' },
      ],
      include: {
        student: { select: { name: true, studentProfile: { select: { studentId: true } } } },
        book: { select: { title: true } },
      },
    });

    const formatted = entries.map((e, idx) => ({
      id: e.id,
      studentId: e.studentId,
      studentName: e.student.name,
      studentRollNo: e.student.studentProfile?.studentId || 'N/A',
      bookId: e.bookId,
      bookTitle: e.book.title,
      queuePosition: idx + 1,
      requestTimestamp: e.requestTimestamp.toISOString(),
      impactScoreSnapshot: e.impactScoreSnapshot,
      status: e.status,
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/queue/student/:studentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role === 'STUDENT' && req.params.studentId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot view another student queue' });
    }
    const entries = await prisma.queueEntry.findMany({
      where: { studentId: req.params.studentId, status: 'WAITING' },
      include: { book: { select: { title: true } }, student: { select: { name: true, studentProfile: { select: { studentId: true } } } } },
    });

    // Compute actual rank for each book queue
    const results = await Promise.all(entries.map(async (entry) => {
      const aheadCount = await prisma.queueEntry.count({
        where: {
          bookId: entry.bookId,
          status: 'WAITING',
          OR: [
            { impactScoreSnapshot: { gt: entry.impactScoreSnapshot } },
            {
              impactScoreSnapshot: entry.impactScoreSnapshot,
              requestTimestamp: { lt: entry.requestTimestamp },
            },
          ],
        },
      });

      return {
        id: entry.id,
        studentId: entry.studentId,
        studentName: entry.student.name,
        studentRollNo: entry.student.studentProfile?.studentId || 'N/A',
        bookId: entry.bookId,
        bookTitle: entry.book.title,
        queuePosition: aheadCount + 1,
        requestTimestamp: entry.requestTimestamp.toISOString(),
        impactScoreSnapshot: entry.impactScoreSnapshot,
        status: entry.status,
      };
    }));

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/queue/join', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const { bookId } = req.body;
    const studentId = req.user!.id;
    const existing = await prisma.queueEntry.findFirst({
      where: { bookId, studentId, status: 'WAITING' },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already in waiting queue for this book' });
    }

    const profile = await prisma.studentProfile.findFirst({ where: { userId: studentId } });
    const score = profile?.impactScore || 0;

    const entry = await prisma.queueEntry.create({
      data: {
        bookId,
        studentId,
        queuePosition: 1,
        impactScoreSnapshot: score,
        status: 'WAITING',
      },
    });

    res.status(201).json({ success: true, message: 'Joined waiting queue successfully!', entry });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/queue/leave', authenticateToken, requireRole(['STUDENT']), async (req: AuthenticatedRequest, res) => {
  try {
    const { queueId } = req.body;
    const studentId = req.user!.id;
    await prisma.queueEntry.updateMany({
      where: { id: queueId, studentId },
      data: { status: 'CANCELLED' },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STATS & STUDENTS DIRECTORY ---
app.get('/api/stats/librarian', authenticateToken, requireRole(['LIBRARIAN']), async (req: AuthenticatedRequest, res) => {
  try {
    const [totalStudents, totalBooksAggr, currentlyBorrowed, pendingBorrowRequests, pendingDonationRequests, totalDonationsApproved] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.book.aggregate({
        _sum: { totalCopies: true, availableCopies: true },
      }),
      prisma.borrowTransaction.count({ where: { status: 'ISSUED' } }),
      prisma.borrowRequest.count({ where: { status: 'PENDING' } }),
      prisma.donationRequest.count({ where: { status: 'PENDING' } }),
      prisma.donationRequest.count({ where: { status: 'APPROVED' } }),
    ]);

    res.json({
      totalStudents,
      totalBooks: totalBooksAggr._sum.totalCopies || 0,
      availableBooks: totalBooksAggr._sum.availableCopies || 0,
      currentlyBorrowed,
      pendingBorrowRequests,
      pendingDonationRequests,
      totalDonationsApproved,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/student/:studentId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user!.role === 'STUDENT' && req.params.studentId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot view another student stats' });
    }
    const studentId = req.params.studentId;
    const [currentlyBorrowed, pendingBorrowRequests, readyForPickup, profile, approvedDonations, activeQueuePositions] = await Promise.all([
      prisma.borrowTransaction.count({ where: { studentId, status: 'ISSUED' } }),
      prisma.borrowRequest.count({ where: { studentId, status: 'PENDING' } }),
      prisma.borrowRequest.count({ where: { studentId, status: 'ACCEPTED' } }),
      prisma.studentProfile.findFirst({ where: { userId: studentId } }),
      prisma.donationRequest.count({ where: { studentId, status: 'APPROVED' } }),
      prisma.queueEntry.count({ where: { studentId, status: 'WAITING' } }),
    ]);

    res.json({
      currentlyBorrowed,
      pendingBorrowRequests,
      readyForPickup,
      impactScore: profile?.impactScore || 0,
      approvedDonations,
      activeQueuePositions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/students', authenticateToken, requireRole(['LIBRARIAN']), async (req: AuthenticatedRequest, res) => {
  try {
    const profiles = await prisma.studentProfile.findMany({
      include: { user: true },
      orderBy: { impactScore: 'desc' },
    });

    const result = profiles.map(p => ({
      user: {
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        role: p.user.role,
        isProfileComplete: p.user.isProfileComplete,
        createdAt: p.user.createdAt.toISOString(),
      },
      profile: {
        id: p.id,
        userId: p.userId,
        studentId: p.studentId,
        department: p.department,
        academicYear: p.academicYear,
        semester: p.semester,
        collegeAffiliation: p.collegeAffiliation,
        impactScore: p.impactScore,
        totalDonations: p.totalDonations,
        activeBorrowingsCount: p.activeBorrowingsCount,
      },
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[BookLoop API] Connected to NeonDB & running on port ${PORT}`);
  });
}

export default app;
