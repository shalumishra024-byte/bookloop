import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryService } from '@/services/libraryService';
import { 
  LibrarianStats, 
  BorrowRequest, 
  DonationRequest, 
  BorrowTransaction 
} from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  BookmarkCheck, 
  Clock, 
  HeartHandshake, 
  ArrowRight, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const LibrarianDashboard: React.FC = () => {
  const [stats, setStats] = useState<LibrarianStats | null>(null);
  const [pendingBorrow, setPendingBorrow] = useState<BorrowRequest[]>([]);
  const [pendingDonations, setPendingDonations] = useState<DonationRequest[]>([]);
  const [recentIssued, setRecentIssued] = useState<BorrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [s, b, d, i] = await Promise.all([
      libraryService.getLibrarianStats(),
      libraryService.getBorrowRequests({ status: 'PENDING' }),
      libraryService.getDonationRequests({ status: 'PENDING' }),
      libraryService.getBorrowTransactions({ status: 'ISSUED' }),
    ]);
    setStats(s);
    setPendingBorrow(b);
    setPendingDonations(d);
    setRecentIssued(i);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 bg-muted rounded"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#6C5B7B]">Librarian Management Portal</h1>
          <p className="text-sm text-muted-foreground">
            Circulation management, book inventory, donation verification, and queue oversight
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/librarian/books">
            <Button size="sm" variant="default" className="text-xs">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Manage Inventory
            </Button>
          </Link>
          <Link to="/librarian/requests">
            <Button size="sm" variant="outline" className="text-xs">
              Review Requests ({pendingBorrow.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">Total Students</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold">{stats?.totalStudents || 0}</span>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">Total Catalog</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold">{stats?.totalBooks || 0}</span>
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">Available Copies</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats?.availableBooks || 0}</span>
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">Currently Borrowed</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold">{stats?.currentlyBorrowed || 0}</span>
            <BookmarkCheck className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3.5 border-[#FFB7A5] bg-[#FFB7A5]/35">
          <span className="text-[11px] font-semibold text-[#6C5B7B] block truncate">Borrow Requests</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#355C7D]">{stats?.pendingBorrowRequests || 0}</span>
            <Clock className="h-3.5 w-3.5 text-[#F67280]" />
          </div>
        </Card>

        <Card className="p-3.5 border-border bg-card">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">Donation Requests</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold">{stats?.pendingDonationRequests || 0}</span>
            <HeartHandshake className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Two Columns: Actionable Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Borrow Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base">Pending Borrowing Requests</CardTitle>
              <p className="text-xs text-muted-foreground">Students awaiting book reservation approval</p>
            </div>
            <Link to="/librarian/requests">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingBorrow.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                No pending borrowing requests at this time.
              </div>
            ) : (
              pendingBorrow.slice(0, 3).map((req) => (
                <div key={req.id} className="p-3 border rounded-md flex items-center justify-between bg-card">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-semibold leading-tight">{req.bookTitle}</h5>
                    {req.bookAuthor && (
                      <p className="text-[11px] text-muted-foreground">Author: {req.bookAuthor}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Student: <strong className="text-foreground">{req.studentName}</strong> ({req.studentRollNo})
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <Badge
                        variant={(req.bookAvailableCopies ?? 0) <= 0 ? 'destructive' : (req.bookAvailableCopies ?? 0) === 1 ? 'warning' : 'secondary'}
                        className="text-[10px]"
                      >
                        {(req.bookAvailableCopies ?? 0) <= 0
                          ? 'Available Copies: 0 – Currently Unavailable'
                          : `Available Copies: ${req.bookAvailableCopies}${req.bookTotalCopies !== undefined ? ` / ${req.bookTotalCopies}` : ''}`}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Requested: {formatDate(req.requestDate)}
                      </span>
                    </div>
                  </div>
                  <Link to="/librarian/requests">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Review
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Book Donations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base">Pending Book Donations</CardTitle>
              <p className="text-xs text-muted-foreground">Inspect photos & approve Impact Score</p>
            </div>
            <Link to="/librarian/donations">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDonations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                No pending book donations requiring review.
              </div>
            ) : (
              pendingDonations.slice(0, 3).map((don) => (
                <div key={don.id} className="p-3 border rounded-md flex items-center justify-between bg-card">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-semibold leading-tight">{don.title}</h5>
                      {don.isDemo && (
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">DEMO</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Donor: <strong className="text-foreground">{don.studentName}</strong> • Condition: {don.condition} • Rating: {don.studentQualityRating ?? 7}/10
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Submitted: {formatDate(don.createdAt)}
                    </p>
                  </div>
                  <Link to={`/librarian/donations?inspect=${don.id}`}>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Currently Issued Circulation Quick View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base">Active Book Circulation & Returns</CardTitle>
            <p className="text-xs text-muted-foreground">
              Mark books as returned when students bring them back to the circulation counter
            </p>
          </div>
          <Link to="/librarian/returns">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Manage Returns <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentIssued.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No books currently on loan.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentIssued.slice(0, 4).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold">{tx.bookTitle}</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Student: {tx.studentName} • Copy: <span className="font-mono">{tx.copyNumber}</span> • Due: {formatDate(tx.expectedReturnDate)}
                    </p>
                  </div>
                  <Link to="/librarian/returns">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Return Workflow
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
