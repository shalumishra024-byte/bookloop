import React, { useEffect, useState } from 'react';
import { libraryService } from '@/services/libraryService';
import { BorrowRequest } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, Check, Sparkles } from 'lucide-react';

export const LibrarianBorrowings: React.FC = () => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<BorrowRequest | null>(null);
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | 'ISSUE' | null>(null);
  const [pickupHours, setPickupHours] = useState(48);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const data = await libraryService.getBorrowRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async () => {
    if (!selectedReq || !actionType) return;
    setProcessing(true);
    try {
      if (actionType === 'ACCEPT') {
        const ok = await libraryService.approveBorrowRequest(selectedReq.id, pickupHours, notes);
        if (ok) setNotification(`Accepted! Physical copy reserved with a ${pickupHours}-hour collection deadline.`);
      } else if (actionType === 'REJECT') {
        const ok = await libraryService.rejectBorrowRequest(selectedReq.id, notes || 'Rejected by library authority.');
        if (ok) setNotification('Borrowing request rejected.');
      } else if (actionType === 'ISSUE') {
        const ok = await libraryService.issueBook(selectedReq.id, 14);
        if (ok) setNotification(`Marked as ISSUED. Physical copy ${selectedReq.copyNumber} handed to student.`);
      }
      setSelectedReq(null);
      setActionType(null);
      setNotes('');
      loadRequests();
    } catch {
      setNotification('Error processing action.');
    } finally {
      setProcessing(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Borrowing Requests Management</h1>
        <p className="text-sm text-muted-foreground">
          Review student borrowing submissions, define pickup deadlines, and mark physical copy collection as Issued
        </p>
      </div>

      {notification && (
        <div className="p-3 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
          {notification}
        </div>
      )}

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">All Borrowing Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No borrowing requests found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Impact Score</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Copy & Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs block">{r.studentName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{r.studentRollNo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-xs max-w-[200px] truncate">
                      {r.bookTitle}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Sparkles className="h-3 w-3 mr-1 fill-amber-500" />
                        {r.impactScoreAtRequest} pts
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(r.requestDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === 'ACCEPTED'
                            ? 'success'
                            : r.status === 'COMPLETED'
                            ? 'outline'
                            : r.status === 'REJECTED'
                            ? 'destructive'
                            : 'warning'
                        }
                        className="text-[11px]"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.status === 'ACCEPTED' ? (
                        <div className="space-y-0.5 font-mono">
                          <span className="font-bold text-foreground block">Copy: {r.copyNumber}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            Due {formatRelativeTime(r.pickupDeadline)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'PENDING' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => {
                              setSelectedReq(r);
                              setActionType('ACCEPT');
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedReq(r);
                              setActionType('REJECT');
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {r.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setSelectedReq(r);
                            setActionType('ISSUE');
                          }}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Mark as Issued
                        </Button>
                      )}

                      {r.status !== 'PENDING' && r.status !== 'ACCEPTED' && (
                        <span className="text-xs text-muted-foreground italic">Archived</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation & Deadline Dialog */}
      <Dialog open={!!selectedReq && !!actionType} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'ACCEPT' && 'Approve Borrowing Request'}
            {actionType === 'REJECT' && 'Reject Borrowing Request'}
            {actionType === 'ISSUE' && 'Issue Book to Student'}
          </DialogTitle>
          <DialogDescription>
            {actionType === 'ACCEPT' && 'Reserve a physical copy and define student collection deadline.'}
            {actionType === 'REJECT' && 'Specify the reason for request rejection.'}
            {actionType === 'ISSUE' && 'Confirm that the student has arrived and collected the physical copy.'}
          </DialogDescription>
        </DialogHeader>

        {selectedReq && (
          <div className="space-y-3 py-2">
            <div className="p-3 bg-muted rounded-md space-y-1">
              <p className="text-xs font-semibold">{selectedReq.bookTitle}</p>
              <p className="text-xs text-muted-foreground">
                Student: <strong>{selectedReq.studentName}</strong> ({selectedReq.studentRollNo}) • Impact Score: {selectedReq.impactScoreAtRequest} pts
              </p>
            </div>

            {actionType === 'ACCEPT' && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Pickup Deadline Window (Hours)</label>
                <select
                  value={pickupHours}
                  onChange={(e) => setPickupHours(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-card text-card-foreground px-3 py-1 text-xs"
                >
                  <option value={24}>24 Hours (Next day)</option>
                  <option value={48}>48 Hours (Standard)</option>
                  <option value={72}>72 Hours (3 days)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  If the student fails to collect within this window, reservation automatically expires and top queued student receives priority.
                </p>
              </div>
            )}

            {actionType === 'REJECT' && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Reason for Rejection *</label>
                <textarea
                  className="w-full rounded-md border p-2 text-xs"
                  rows={2}
                  placeholder="e.g. Incomplete verification or outstanding fines..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>
            )}

            {actionType === 'ISSUE' && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200">
                Confirming collection for physical copy <strong className="font-mono">{selectedReq.copyNumber}</strong>. Standard borrowing loan duration is 14 days.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)} disabled={processing}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={actionType === 'REJECT' ? 'destructive' : 'default'}
            onClick={handleAction}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
