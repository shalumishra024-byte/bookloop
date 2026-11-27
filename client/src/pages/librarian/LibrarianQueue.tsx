import React, { useEffect, useState } from 'react';
import { libraryService } from '@/services/libraryService';
import { QueueEntry } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Clock, Sparkles, CheckCircle2, Info } from 'lucide-react';

export const LibrarianQueue: React.FC = () => {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const list = await libraryService.getQueueEntries();
    setEntries(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group by book
  const groupedByBook = entries.reduce((acc, curr) => {
    if (!acc[curr.bookId]) {
      acc[curr.bookId] = { title: curr.bookTitle, list: [] };
    }
    acc[curr.bookId].list.push(curr);
    return acc;
  }, {} as Record<string, { title: string; list: QueueEntry[] }>);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Queue Priority & Allocation Engine</h1>
        <p className="text-sm text-muted-foreground">
          System-wide waiting queues for unavailable books, ranked by donation Impact Score and timestamp
        </p>
      </div>

      {/* Priority Engine Overview */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Automated Priority Engine Logic</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The queue automatically recomputes priority order whenever books are requested, returned, or when reservations expire.
            Primary sorting evaluates Impact Score in descending order; secondary sorting evaluates request timestamp in ascending order.
            Zero-score students remain fully eligible according to First-Come-First-Serve order.
          </p>
        </CardContent>
      </Card>

      {/* Book Queues */}
      {loading ? (
        <div className="p-6 text-center text-xs text-muted-foreground">Loading queue allocations...</div>
      ) : Object.keys(groupedByBook).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-xs text-muted-foreground border-dashed">
            No active waiting queues in the system. All requested books currently have copies available.
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByBook).map(([bookId, { title, list }]) => (
          <Card key={bookId}>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{list.length} student(s) waiting in queue</p>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {list.length} in Queue
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Impact Score</TableHead>
                    <TableHead>Request Timestamp</TableHead>
                    <TableHead>Priority Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Badge
                          variant={q.queuePosition === 1 ? 'success' : 'outline'}
                          className="font-mono text-xs font-bold"
                        >
                          #{q.queuePosition}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs">{q.studentName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{q.studentRollNo}</TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                          {q.impactScoreSnapshot} pts
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(q.requestTimestamp)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {q.queuePosition === 1
                          ? 'Highest combined Impact Score & earliest request'
                          : `Preceded by higher impact score or earlier timestamp`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
