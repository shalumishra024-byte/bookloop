import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { 
  StudentStats, 
  BorrowRequest, 
  BorrowTransaction, 
  QueueEntry, 
  DonationRequest 
} from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { 
  BookCheck, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  HeartHandshake, 
  Library, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [activeBorrowings, setActiveBorrowings] = useState<BorrowTransaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BorrowRequest[]>([]);
  const [myQueue, setMyQueue] = useState<QueueEntry[]>([]);
  const [myDonations, setMyDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const [s, b, r, q, d] = await Promise.all([
        libraryService.getStudentStats(user.id),
        libraryService.getBorrowTransactions({ studentId: user.id, status: 'ISSUED' }),
        libraryService.getBorrowRequests({ studentId: user.id }),
        libraryService.getStudentQueueEntries(user.id),
        libraryService.getDonationRequests({ studentId: user.id }),
      ]);
      setStats(s);
      setActiveBorrowings(b);
      setPendingRequests(r);
      setMyQueue(q);
      setMyDonations(d);
      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  const readyForPickup = pendingRequests.filter(r => r.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#6C5B7B]">Student Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name}. Roll No: <span className="font-mono font-medium text-foreground">{studentProfile?.studentId}</span> ({studentProfile?.department})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/catalog">
            <Button size="sm" variant="default" className="text-xs">
              <Library className="h-3.5 w-3.5 mr-1.5" />
              Browse Books
            </Button>
          </Link>
          <Link to="/student/donations">
            <Button size="sm" variant="outline" className="text-xs">
              <HeartHandshake className="h-3.5 w-3.5 mr-1.5" />
              Donate a Book
            </Button>
          </Link>
        </div>
      </div>

      {/* Ready for Pickup Alert */}
      {readyForPickup.length > 0 && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Book Ready for Collection!
            </h4>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Your borrowing request for <strong>"{readyForPickup[0].bookTitle}"</strong> has been approved. Assigned copy: <span className="font-mono font-bold">{readyForPickup[0].copyNumber}</span>.
              Please collect it from the library desk before: <strong>{formatDate(readyForPickup[0].pickupDeadline)}</strong>.
            </p>
          </div>
          <Link to="/student/borrowings">
            <Button size="sm" variant="outline" className="text-xs h-7">
              View Details
            </Button>
          </Link>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Currently Borrowed</span>
            <BookCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold">{stats?.currentlyBorrowed || 0}</div>
            <span className="text-xs text-muted-foreground">Active in-hand</span>
          </div>
        </Card>

        {/* Card 2 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Requests</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold">{pendingRequests.filter(r => r.status === 'PENDING').length}</div>
            <span className="text-xs text-muted-foreground">Awaiting review</span>
          </div>
        </Card>

        {/* Card 3 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Ready for Pickup</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats?.readyForPickup || 0}</div>
            <span className="text-xs text-muted-foreground">Hold at desk</span>
          </div>
        </Card>

        {/* Card 4 - Impact Score */}
        <Card className="p-4 border-[#FFB7A5] bg-[#FFB7A5]/35">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6C5B7B]">Donation Impact Score</span>
            <Sparkles className="h-4 w-4 text-[#F67280] fill-[#F67280]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-[#355C7D]">{studentProfile?.impactScore || 0} pts</div>
            <span className="text-xs text-[#6C5B7B]">{studentProfile?.totalDonations || 0} approved donations</span>
          </div>
          <p className="text-[11px] text-[#355C7D]/85 mt-1">
            Priority weight in book waiting queues
          </p>
        </Card>
      </div>

      {/* Main Grid: Borrowings & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Borrowed Books */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base">Currently Borrowed Books</CardTitle>
              <p className="text-xs text-muted-foreground">Books issued to you with upcoming return deadlines</p>
            </div>
            <Link to="/student/borrowings">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                All History <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBorrowings.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                You have no books currently borrowed.
              </div>
            ) : (
              activeBorrowings.map((tx) => (
                <div key={tx.id} className="p-3 border rounded-md flex items-center justify-between bg-card">
                  <div className="space-y-1">
                    <h5 className="text-xs font-semibold leading-tight">{tx.bookTitle}</h5>
                    <div className="flex items-center space-x-2 text-[11px] text-muted-foreground font-mono">
                      <span>Copy: {tx.copyNumber}</span>
                      <span>•</span>
                      <span>Due: {formatDate(tx.expectedReturnDate)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatRelativeTime(tx.expectedReturnDate)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Waiting Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base">Waiting Queue Positions</CardTitle>
              <p className="text-xs text-muted-foreground">Calculated with Impact Score + Request timestamp</p>
            </div>
            <Link to="/student/queue">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Queue Details <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myQueue.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                You are not currently waiting in any book queues.
              </div>
            ) : (
              myQueue.map((q) => (
                <div key={q.id} className="p-3 border rounded-md flex items-center justify-between bg-card">
                  <div className="space-y-1">
                    <h5 className="text-xs font-semibold leading-tight">{q.bookTitle}</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Requested: {formatDate(q.requestTimestamp)} • Evaluated with {q.impactScoreSnapshot} pts
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={q.queuePosition === 1 ? 'success' : 'secondary'} className="text-xs font-mono font-bold">
                      Position #{q.queuePosition}
                    </Badge>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      {q.queuePosition === 1 ? 'Next in line!' : `${q.queuePosition - 1} ahead`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Donations & Impact Contribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base">My Book Donations</CardTitle>
            <p className="text-xs text-muted-foreground">
              Donating books builds your Impact Score: Excellent (+10 pts), Good (+7 pts), Acceptable (+4 pts)
            </p>
          </div>
          <Link to="/student/donations">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Donate More <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {myDonations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No book donations yet. Donate books you no longer need to boost your Impact Score!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myDonations.slice(0, 3).map((don) => (
                <div key={don.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-semibold">{don.title}</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Condition: {don.condition} • Submitted {formatDate(don.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {don.status === 'APPROVED' && don.pointsAwarded && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        +{don.pointsAwarded} pts
                      </span>
                    )}
                    <Badge
                      variant={
                        don.status === 'APPROVED' ? 'success' : don.status === 'REJECTED' ? 'destructive' : 'warning'
                      }
                      className="text-xs"
                    >
                      {don.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
