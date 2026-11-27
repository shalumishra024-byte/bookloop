import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { Book, QueueEntry } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BookmarkCheck,
  HeartHandshake
} from 'lucide-react';

export const BookCatalog: React.FC = () => {
  const { user, studentProfile, role } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals for Request and Queue
  const [requestBook, setRequestBook] = useState<Book | null>(null);
  const [queueBook, setQueueBook] = useState<Book | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isLibrarian = role === 'LIBRARIAN';

  const loadBooks = async () => {
    setLoading(true);
    const data = await libraryService.getBooks({
      search,
      category: selectedCategory,
      status: selectedStatus,
      source: selectedSource,
    });
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, [search, selectedCategory, selectedStatus, selectedSource]);

  const handleBorrowRequest = async () => {
    if (!requestBook || !user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await libraryService.createBorrowRequest(requestBook.id, user.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          setRequestBook(null);
          setActionMessage(null);
          loadBooks();
        }, 1500);
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to submit borrowing request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!queueBook || !user) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await libraryService.joinQueue(queueBook.id, user.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          setQueueBook(null);
          setActionMessage(null);
          loadBooks();
        }, 1500);
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to join queue.' });
    } finally {
      setActionLoading(false);
    }
  };

  const categories = ['ALL', 'Computer Science', 'Software Engineering', 'Networking', 'Artificial Intelligence', 'Mathematics'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library Book Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Search, borrow, or queue for college course literature and reference books
          </p>
        </div>
        {!isLibrarian && studentProfile && (
          <div className="flex items-center space-x-2 bg-muted px-3 py-1.5 rounded-lg border text-xs">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Your Impact Score: <strong>{studentProfile.impactScore} pts</strong></span>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              placeholder="Search by title, author, keyword, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-card text-card-foreground px-3 py-1 text-xs"
            >
              <option value="ALL">All Availability</option>
              <option value="AVAILABLE">Available Now</option>
              <option value="UNAVAILABLE">Unavailable / Queued</option>
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="h-9 rounded-md border border-input bg-card text-card-foreground px-3 py-1 text-xs"
            >
              <option value="ALL">All Sources</option>
              <option value="LIBRARY">College Library Stock</option>
              <option value="DONATION">Student Donated</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5">
          <span className="text-xs text-muted-foreground mr-1 flex items-center">
            <Filter className="h-3 w-3 mr-1" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-foreground text-background font-medium'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-lg"></div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-lg">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold">No books match your filters</h3>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms or category criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <Card key={book.id} className="flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow">
                <div>
                  {/* Book Image & Badges */}
                  <div className="relative h-44 bg-muted overflow-hidden">
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                        <BookOpen className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <Badge
                        variant={isAvailable ? 'success' : 'destructive'}
                        className="text-[10px] uppercase font-bold tracking-wider backdrop-blur-md"
                      >
                        {isAvailable ? `${book.availableCopies} Available` : 'Unavailable'}
                      </Badge>
                      {book.source === 'DONATION' && (
                        <Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur-md">
                          <HeartHandshake className="h-3 w-3 mr-1 text-rose-500" />
                          Student Donated
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{book.category}</span>
                      {book.isbn && <span className="font-mono">{book.isbn}</span>}
                    </div>

                    <Link to={`/catalog/${book.id}`} className="hover:underline">
                      <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{book.title}</h3>
                    </Link>

                    <p className="text-xs text-muted-foreground line-clamp-1">by {book.author}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{book.description}</p>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-0 border-t border-border/50 mt-2 flex items-center justify-between gap-2">
                  <Link to={`/catalog/${book.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      View Details
                    </Button>
                  </Link>

                  {!isLibrarian && (
                    isAvailable ? (
                      <Button
                        size="sm"
                        className="text-xs h-8 flex-1"
                        onClick={() => setRequestBook(book)}
                      >
                        <BookmarkCheck className="h-3.5 w-3.5 mr-1" />
                        Borrow
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-8 flex-1 border border-border"
                        onClick={() => setQueueBook(book)}
                      >
                        <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
                        Join Queue
                      </Button>
                    )
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Borrow Request Confirmation Dialog */}
      <Dialog open={!!requestBook} onOpenChange={(open) => !open && setRequestBook(null)}>
        <DialogHeader>
          <DialogTitle>Confirm Borrowing Request</DialogTitle>
          <DialogDescription>
            Submit your borrowing request to the library authority.
          </DialogDescription>
        </DialogHeader>

        {requestBook && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-md space-y-1">
              <p className="text-xs font-semibold text-foreground">{requestBook.title}</p>
              <p className="text-xs text-muted-foreground">Author: {requestBook.author}</p>
              <div className="flex items-center space-x-2 text-[11px] text-muted-foreground pt-1">
                <span>Available Copies: <strong>{requestBook.availableCopies} of {requestBook.totalCopies}</strong></span>
              </div>
            </div>

            <div className="text-xs space-y-1 text-muted-foreground bg-muted/40 p-3 rounded-md border">
              <p className="font-semibold text-foreground">How this works:</p>
              <p>1. The librarian reviews and approves your request.</p>
              <p>2. A physical book copy is reserved with a pickup deadline (typically 48h).</p>
              <p>3. You collect the book at the library circulation desk.</p>
            </div>

            {actionMessage && (
              <div className={`p-3 text-xs rounded-md font-medium ${
                actionMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/15 text-destructive'
              }`}>
                {actionMessage.text}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setRequestBook(null)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleBorrowRequest} disabled={actionLoading}>
            {actionLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Join Waiting Queue Dialog with Transparent Priority Formula */}
      <Dialog open={!!queueBook} onOpenChange={(open) => !open && setQueueBook(null)}>
        <DialogHeader>
          <DialogTitle>Join Book Waiting Queue</DialogTitle>
          <DialogDescription>
            All physical copies of this book are currently issued. Join the priority waiting queue.
          </DialogDescription>
        </DialogHeader>

        {queueBook && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-md space-y-1">
              <p className="text-xs font-semibold text-foreground">{queueBook.title}</p>
              <p className="text-xs text-muted-foreground">Total Copies: {queueBook.totalCopies} (0 Available)</p>
            </div>

            {/* Transparent Priority Explanation */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md space-y-2">
              <div className="flex items-center text-xs font-bold text-amber-900 dark:text-amber-300">
                <Sparkles className="h-4 w-4 mr-1 text-amber-500" />
                Transparent Queue Priority Calculation
              </div>
              <p className="text-xs text-muted-foreground">
                Your queue position is dynamically sorted using:
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                <li><strong>Primary:</strong> Higher Donation Impact Score receives priority.</li>
                <li><strong>Secondary:</strong> Earlier request timestamp (FCFS) resolves ties.</li>
              </ul>
              <div className="pt-1 text-xs border-t border-amber-500/20 font-medium">
                Your current Impact Score: <span className="font-bold text-foreground">{studentProfile?.impactScore || 0} pts</span>
              </div>
            </div>

            {actionMessage && (
              <div className={`p-3 text-xs rounded-md font-medium ${
                actionMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-destructive/15 text-destructive'
              }`}>
                {actionMessage.text}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setQueueBook(null)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleJoinQueue} disabled={actionLoading}>
            {actionLoading ? 'Joining...' : 'Confirm Join Queue'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
