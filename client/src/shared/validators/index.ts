import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid college email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  studentId: z.string().min(3, 'Student ID / Registration number is required'),
  department: z.string().min(2, 'Department / Branch is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  collegeAffiliation: z.string().min(2, 'College affiliation is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const collegeProfileSchema = z.object({
  studentId: z.string().min(3, 'Student ID / Registration number is required'),
  department: z.string().min(2, 'Department / Branch is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  collegeAffiliation: z.string().min(2, 'College affiliation is required'),
});

export const bookCreateSchema = z.object({
  title: z.string().min(2, 'Book title is required'),
  author: z.string().min(2, 'Author name is required'),
  isbn: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  totalCopies: z.coerce.number().min(1, 'At least 1 copy is required'),
  coverImage: z.string().url().optional().or(z.literal('')),
  source: z.enum(['LIBRARY', 'DONATION']).default('LIBRARY'),
});

export const bookUpdateSchema = bookCreateSchema.partial();

export const donationRequestSchema = z.object({
  title: z.string().min(2, 'Book title is required'),
  author: z.string().min(2, 'Author is required'),
  isbn: z.string().optional(),
  category: z.string().optional(),
  description: z.string().min(10, 'Please describe book condition and details'),
  condition: z.enum(['EXCELLENT', 'GOOD', 'ACCEPTABLE']),
  images: z.array(z.string()).min(1, 'At least one photograph is required'),
});

export const borrowRequestSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
});

export const approveBorrowRequestSchema = z.object({
  pickupWindowHours: z.coerce.number().min(1).max(168).default(48),
  copyId: z.string().optional(),
  notes: z.string().optional(),
});

export const rejectRequestSchema = z.object({
  reason: z.string().min(3, 'Reason for rejection is required'),
});

export const approveDonationSchema = z.object({
  verifiedCondition: z.enum(['EXCELLENT', 'GOOD', 'ACCEPTABLE']),
  notes: z.string().optional(),
  targetCategory: z.string().optional(),
});

export const issueBookSchema = z.object({
  borrowDurationDays: z.coerce.number().min(1).max(60).default(14),
});
