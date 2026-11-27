import React, { useEffect, useState } from 'react';
import { libraryService } from '@/services/libraryService';
import { BorrowTransaction } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { BookmarkCheck, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const LibrarianReturns: React.FC = () => {
  const [transactions, setTransactions] = useState<BorrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<BorrowTransaction | null>(null);
  const [returning, setReturning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await libraryService.getBorrowTransactions();
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReturn = async (txId: string) => {
    setReturning(true);
    try {
      const ok = await libraryService.returnBook(txId);
      if (ok) {
        setNotice('Book marked as RETURNED. Physical copy restored to inventory and checked against waiting queues.');
        loadData();
      }
    } catch {
      setNotice('Failed to process book return.');
    } finally {
      setReturning(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const activeIssued = transactions.filter(t => t.status === 'ISSUED');
  const pastReturned = transactions.filter(t => t.status === 'RETURNED');

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Circulation Desk & Book Returns</h1>
        <p className="text-sm text-muted-foreground">
          Track books currently issued to students, monitor deadlines, and mark returned books to release inventory
        </p>
      </div>

      {notice && (
        <div className="p-3 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
          {notice}
        </div>
      )}

      {/* Currently Issued On-Loan Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Currently Borrowed Books ({activeIssued.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading circulation records...</div>
          ) : activeIssued.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No books currently on loan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Copy Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Return Deadline</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeIssued.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-semibold text-xs">{tx.studentName}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{tx.bookTitle}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{tx.copyNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(tx.issueDate)}</TableCell>
                    <TableCell className="text-xs font-semibold">{formatDate(tx.expectedReturnDate)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(tx.expectedReturnDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7"
                        disabled={returning}
                        onClick={() => handleReturn(tx.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Mark as Returned
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Returned History */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Recent Returned History</CardTitle>
        </CardHeader>
        <CardContent>
          {pastReturned.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No returned records yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Copy</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Actual Return Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastReturned.slice(0, 5).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-semibold text-xs">{tx.studentName}</TableCell>
                    <TableCell className="text-xs">{tx.bookTitle}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.copyNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(tx.issueDate)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(tx.actualReturnDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">RETURNED</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
