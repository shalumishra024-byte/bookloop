import {
  Book,
  BookCopy,
  BorrowRequest,
  BorrowTransaction,
  DonationRequest,
  QueueEntry,
  LibrarianStats,
  StudentStats,
  BookCondition,
  StudentProfile,
  User,
} from '@college-library/shared';

import { API_BASE_URL } from '@/lib/api';

const API_BASE = API_BASE_URL;

class LibraryService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('bookloop_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- BOOKS & CATALOG ---
  async getBooks(filters?: {
    search?: string;
    category?: string;
    status?: string;
    source?: string;
  }): Promise<Book[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);

    const res = await fetch(`${API_BASE}/books?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async getBookById(id: string): Promise<Book | undefined> {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return undefined;
    return res.json();
  }

  async getBookCopies(bookId: string): Promise<BookCopy[]> {
    const res = await fetch(`${API_BASE}/books/${bookId}/copies`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async createBook(data: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'availableCopies'>): Promise<Book> {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // --- BORROW REQUESTS ---
  async getBorrowRequests(filters?: { studentId?: string; status?: string }): Promise<BorrowRequest[]> {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);

    const res = await fetch(`${API_BASE}/borrow/requests?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async createBorrowRequest(bookId: string, studentId: string): Promise<{ success: boolean; message: string; request?: BorrowRequest }> {
    const res = await fetch(`${API_BASE}/borrow/requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ bookId, studentId }),
    });
    return res.json();
  }

  async approveBorrowRequest(
    requestId: string,
    pickupWindowHours: number = 48,
    notes?: string
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/borrow/requests/${requestId}/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ pickupWindowHours, notes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || 'Failed to approve request' };
    }
    return { ok: true };
  }

  async rejectBorrowRequest(requestId: string, notes?: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/borrow/requests/${requestId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ notes }),
    });
    return res.ok;
  }

  async cancelBorrowRequest(requestId: string, studentId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/borrow/requests/${requestId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId }),
    });
    return res.ok;
  }

  // --- CIRCULATION & RETURNS ---
  async issueBook(requestId: string, borrowDurationDays: number = 14): Promise<boolean> {
    const res = await fetch(`${API_BASE}/borrow/requests/${requestId}/issue`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ borrowDurationDays }),
    });
    return res.ok;
  }

  async returnBook(transactionId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/borrow/transactions/${transactionId}/return`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  async getBorrowTransactions(filters?: { studentId?: string; status?: string }): Promise<BorrowTransaction[]> {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);

    const res = await fetch(`${API_BASE}/borrow/transactions?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  // --- WAITING QUEUE ---
  async getQueueEntries(bookId?: string): Promise<QueueEntry[]> {
    const params = new URLSearchParams();
    if (bookId) params.append('bookId', bookId);

    const res = await fetch(`${API_BASE}/queue?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async getStudentQueueEntries(studentId: string): Promise<QueueEntry[]> {
    const res = await fetch(`${API_BASE}/queue/student/${studentId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async joinQueue(bookId: string, studentId: string): Promise<{ success: boolean; message: string; position?: number }> {
    const res = await fetch(`${API_BASE}/queue/join`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ bookId, studentId }),
    });
    return res.json();
  }

  async leaveQueue(queueId: string, studentId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/queue/leave`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ queueId, studentId }),
    });
    return res.ok;
  }

  // --- DONATIONS & IMPACT SCORE ---
  async getDonationRequests(filters?: { studentId?: string; status?: string }): Promise<DonationRequest[]> {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.status) params.append('status', filters.status);

    const res = await fetch(`${API_BASE}/donations?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  async createDonationRequest(
    data: {
      title: string;
      author: string;
      isbn?: string;
      category?: string;
      description: string;
      condition: BookCondition;
      studentQualityRating: number;
      images: string[];
    },
    studentId: string
  ): Promise<DonationRequest> {
    const res = await fetch(`${API_BASE}/donations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...data, studentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit donation');
    }
    return res.json();
  }

  async approveDonationRequest(
    donationId: string,
    verifiedCondition: BookCondition,
    verifiedQualityRating: number,
    librarianNotes?: string,
    targetCategory?: string
  ): Promise<boolean> {
    const res = await fetch(`${API_BASE}/donations/${donationId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ verifiedCondition, verifiedQualityRating, notes: librarianNotes, targetCategory }),
    });
    return res.ok;
  }

  async rejectDonationRequest(
    donationId: string,
    librarianNotes?: string,
    verifiedQualityRating?: number
  ): Promise<boolean> {
    const res = await fetch(`${API_BASE}/donations/${donationId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ notes: librarianNotes, verifiedQualityRating }),
    });
    return res.ok;
  }

  // --- STATS & STUDENTS DIRECTORY ---
  async getLibrarianStats(): Promise<LibrarianStats> {
    const res = await fetch(`${API_BASE}/stats/librarian`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      return {
        totalStudents: 0,
        totalBooks: 0,
        availableBooks: 0,
        currentlyBorrowed: 0,
        pendingBorrowRequests: 0,
        pendingDonationRequests: 0,
        totalDonationsApproved: 0,
      };
    }
    return res.json();
  }

  async getStudentStats(studentId: string): Promise<StudentStats> {
    const res = await fetch(`${API_BASE}/stats/student/${studentId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      return {
        currentlyBorrowed: 0,
        pendingBorrowRequests: 0,
        readyForPickup: 0,
        impactScore: 0,
        approvedDonations: 0,
        activeQueuePositions: 0,
      };
    }
    return res.json();
  }

  async getStudentsList(): Promise<{ user: User; profile: StudentProfile }[]> {
    const res = await fetch(`${API_BASE}/students`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }
}

export const libraryService = new LibraryService();
