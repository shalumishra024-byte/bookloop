export const ImpactPointsByCondition = {
  EXCELLENT: 10,
  GOOD: 7,
  ACCEPTABLE: 4,
} as const;

export type UserRole = 'STUDENT' | 'LIBRARIAN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isProfileComplete?: boolean;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentId: string;
  department: string;
  academicYear: string;
  semester: string;
  collegeAffiliation: string;
  impactScore: number;
  totalDonations: number;
  activeBorrowingsCount: number;
}

export interface LibrarianProfile {
  id: string;
  userId: string;
  librarianId: string;
  designation: string;
  libraryName: string;
  department: string;
}

export type BookSource = 'LIBRARY' | 'DONATION';
export type BookStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'LOW_STOCK';
export type BookCondition = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  coverImage?: string;
  source: BookSource;
  status: BookStatus;
  donorName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CopyStatus = 'AVAILABLE' | 'RESERVED' | 'ISSUED' | 'MAINTENANCE';

export interface BookCopy {
  id: string;
  bookId: string;
  copyNumber: string;
  status: CopyStatus;
  condition: BookCondition;
}

export type BorrowRequestStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EXPIRED' 
  | 'CANCELLED' 
  | 'COMPLETED';

export interface BorrowRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRollNo: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCopyId?: string;
  copyNumber?: string;
  requestDate: string;
  status: BorrowRequestStatus;
  pickupDeadline?: string;
  pickupWindowHours?: number;
  impactScoreAtRequest: number;
  librarianNotes?: string;
  reviewDate?: string;
}

export type BorrowTransactionStatus = 'ISSUED' | 'RETURNED' | 'OVERDUE';

export interface BorrowTransaction {
  id: string;
  requestId: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  bookCopyId: string;
  copyNumber: string;
  issueDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: BorrowTransactionStatus;
}

export type DonationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DonationRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  description: string;
  condition: BookCondition;
  studentQualityRating?: number;
  verifiedQualityRating?: number;
  suggestedPoints?: number;
  images: string[];
  status: DonationStatus;
  pointsAwarded?: number;
  librarianNotes?: string;
  isDemo?: boolean;
  createdAt: string;
  reviewedAt?: string;
}

export type QueueStatus = 'WAITING' | 'OFFERED' | 'CONVERTED' | 'CANCELLED';

export interface QueueEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  bookId: string;
  bookTitle: string;
  queuePosition: number;
  requestTimestamp: string;
  impactScoreSnapshot: number;
  status: QueueStatus;
  reservationDeadline?: string;
}

export interface LibrarianStats {
  totalStudents: number;
  totalBooks: number;
  availableBooks: number;
  currentlyBorrowed: number;
  pendingBorrowRequests: number;
  pendingDonationRequests: number;
  totalDonationsApproved: number;
}

export interface StudentStats {
  currentlyBorrowed: number;
  pendingBorrowRequests: number;
  readyForPickup: number;
  impactScore: number;
  approvedDonations: number;
  activeQueuePositions: number;
}
