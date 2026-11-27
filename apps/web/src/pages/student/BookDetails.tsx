import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { Book, BookCopy, QueueEntry } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  HeartHandshake, 
  ShieldCheck,
  BookmarkCheck
} from 'lucide-react';

export const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, studentProfile, role } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isLibrarian = role === 'LIBRARIAN';

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const b = await libraryService.getBookById(id);
    if (!b) {
      setLoading(false);
      return;
    }
    const c = await libraryService.getBookCopies(id);
    const q = await libraryService.getQueueEntries(id);
    setBook(b);
    setCopies(c);
    setQueue(q);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleBorrow = async () => {
    if (!book || !user) return;
    setMessage(null);
    const res = await libraryService.createBorrowRequest(book.id, user.id);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const handleJoinQueue = async () => {
    if (!book || !user) return;
    setMessage(null);
    const res = await libraryService.joinQueue(book.id, user.id);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading book details...</div>;
  }

  if (!book) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Book not found in library record.</p>
        <Link to="/catalog">
          <Button size="sm">Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-muted-foreground">{book.category}</span>
      </div>

      {message && (
        <div className={`p-3 text-xs rounded-md font-medium ${
          message.type === 'success' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/15 text-destructive'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Book Card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Cover */}
          <div className="md:w-64 h-72 md:h-auto bg-muted relative flex-shrink-0">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <BookOpen className="h-16 w-16 opacity-30" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isAvailable ? 'success' : 'destructive'} className="text-xs uppercase font-bold">
                  {isAvailable ? `${book.availableCopies} Copies Available` : 'All Copies Issued'}
                </Badge>
                {book.source === 'DONATION' && (
                  <Badge variant="secondary" className="text-xs">
                    <HeartHandshake className="h-3 w-3 mr-1 text-rose-500" />
                    Donated by {book.donorName || 'Student'}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs font-mono">
                  {book.category}
                </Badge>
              </div>

              <h1 className="text-xl font-bold leading-tight">{book.title}</h1>
              <p className="text-sm text-muted-foreground">By <strong>{book.author}</strong></p>
              {book.isbn && <p className="text-xs text-muted-foreground font-mono">ISBN: {book.isbn}</p>}

              <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                {book.description}
              </p>
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Total physical stock: <strong className="text-foreground">{book.totalCopies} copies</strong>
              </div>

              {!isLibrarian && (
                isAvailable ? (
                  <Button size="sm" onClick={handleBorrow}>
                    <BookmarkCheck className="h-3.5 w-3.5 mr-1.5" />
                    Request Book for Borrowing
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={handleJoinQueue} className="border">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    Join Waiting Queue
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Copy-Level Availability Breakdown */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Physical Copy-Level Inventory</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tracking individual physical copies, barcodes, and current statuses
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {copies.map((copy) => (
              <div key={copy.id} className="py-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-semibold">{copy.copyNumber}</span>
                  <p className="text-[11px] text-muted-foreground">Condition: {copy.condition}</p>
                </div>
                <Badge
                  variant={
                    copy.status === 'AVAILABLE'
                      ? 'success'
                      : copy.status === 'RESERVED'
                      ? 'warning'
                      : 'outline'
                  }
                  className="text-xs font-mono"
                >
                  {copy.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Queue Snapshot (if any) */}
      {queue.length > 0 && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base">Current Waiting Queue ({queue.length} students)</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sorted by Impact Score (descending) then Request Timestamp (ascending)
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {queue.map((q) => (
                <div key={q.id} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold">{q.studentName}</span>
                    <p className="text-[11px] text-muted-foreground">
                      Requested {formatDate(q.requestTimestamp)} • Evaluated Impact: {q.impactScoreSnapshot} pts
                    </p>
                  </div>
                  <Badge variant={q.queuePosition === 1 ? 'success' : 'secondary'} className="text-xs font-mono">
                    Priority #{q.queuePosition}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
