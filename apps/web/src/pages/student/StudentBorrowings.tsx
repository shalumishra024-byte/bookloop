import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { BorrowRequest, BorrowTransaction } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { BookmarkCheck, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const StudentBorrowings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [transactions, setTransactions] = useState<BorrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [reqs, txs] = await Promise.all([
      libraryService.getBorrowRequests({ studentId: user.id }),
      libraryService.getBorrowTransactions({ studentId: user.id }),
    ]);
    setRequests(reqs);
    setTransactions(txs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCancel = async (requestId: string) => {
    if (!user) return;
    const ok = await libraryService.cancelBorrowRequest(requestId, user.id);
    if (ok) {
      setActionMsg('Borrow request cancelled.');
      setTimeout(() => setActionMsg(null), 3000);
      loadData();
    }
  };

  const currentlyIssued = transactions.filter(t => t.status === 'ISSUED');
  const pastHistory = transactions.filter(t => t.status === 'RETURNED');
  const pendingOrAccepted = requests.filter(r => r.status === 'PENDING' || r.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">My Borrowings & Requests</h1>
        <p className="text-sm text-muted-foreground">
          Track books currently issued to you, pending pickup reservations, and return history
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 text-xs bg-muted text-foreground border rounded-md">
          {actionMsg}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Currently Issued ({currentlyIssued.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Pending / Pickup ({pendingOrAccepted.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Return History ({pastHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Currently Issued */}
        <TabsContent value="active">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Books in Possession</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Loading borrowings...</div>
              ) : currentlyIssued.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                  No books currently issued to your account.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Copy Barcode</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Return Due Date</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentlyIssued.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-semibold text-xs">{tx.bookTitle}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.copyNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(tx.issueDate)}</TableCell>
                        <TableCell className="text-xs font-medium">{formatDate(tx.expectedReturnDate)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatRelativeTime(tx.expectedReturnDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success" className="text-[11px]">ISSUED</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Requests & Pickups */}
        <TabsContent value="requests">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Borrowing Requests Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Loading requests...</div>
              ) : pendingOrAccepted.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                  No pending or accepted borrowing requests.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pickup Window Deadline</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrAccepted.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold text-xs">{r.bookTitle}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(r.requestDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={r.status === 'ACCEPTED' ? 'success' : 'warning'}
                            className="text-[11px]"
                          >
                            {r.status === 'ACCEPTED' ? 'Ready for Pickup' : 'Pending Approval'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.status === 'ACCEPTED' ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Collect before {formatDate(r.pickupDeadline)} ({formatRelativeTime(r.pickupDeadline)})
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Awaiting librarian review</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancel(r.id)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: History */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Returned Borrowing Archive</CardTitle>
            </CardHeader>
            <CardContent>
              {pastHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                  No past returned books in your history.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Copy</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Returned On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-semibold text-xs">{h.bookTitle}</TableCell>
                        <TableCell className="font-mono text-xs">{h.copyNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(h.issueDate)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(h.actualReturnDate)}</TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
