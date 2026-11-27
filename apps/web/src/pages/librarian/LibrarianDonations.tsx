import React, { useEffect, useState } from 'react';
import { libraryService } from '@/services/libraryService';
import { DonationRequest, BookCondition } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { HeartHandshake, Sparkles, Check, X, Image as ImageIcon } from 'lucide-react';

export const LibrarianDonations: React.FC = () => {
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<DonationRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [verifiedCondition, setVerifiedCondition] = useState<BookCondition>('EXCELLENT');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadDonations = async () => {
    setLoading(true);
    const data = await libraryService.getDonationRequests();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleAction = async () => {
    if (!selectedDonation || !actionType) return;
    setProcessing(true);
    try {
      if (actionType === 'APPROVE') {
        const ok = await libraryService.approveDonationRequest(
          selectedDonation.id,
          verifiedCondition,
          notes || 'Verified by librarian.'
        );
        if (ok) setMsg(`Donation approved! Impact score points awarded and book added to library inventory.`);
      } else {
        const ok = await libraryService.rejectDonationRequest(
          selectedDonation.id,
          notes || 'Did not meet library physical condition criteria.'
        );
        if (ok) setMsg('Donation request rejected.');
      }
      setSelectedDonation(null);
      setActionType(null);
      setNotes('');
      loadDonations();
    } catch {
      setMsg('Error processing donation request.');
    } finally {
      setProcessing(false);
      setTimeout(() => setMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Student Book Donations Review</h1>
        <p className="text-sm text-muted-foreground">
          Inspect student-submitted photographs, verify physical condition, award Impact Points, and intake into inventory
        </p>
      </div>

      {msg && (
        <div className="p-3 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
          {msg}
        </div>
      )}

      {/* Donations List */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">All Donation Requests ({donations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading submissions...</div>
          ) : donations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No donation requests in system.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {donations.map((don) => (
                <div key={don.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    {/* Photograph Preview */}
                    <div className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0 border">
                      {don.images[0] ? (
                        <img src={don.images[0]} alt={don.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-30" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold leading-tight">{don.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Author: <strong>{don.author}</strong> {don.isbn && `• ISBN: ${don.isbn}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Student Donor: <strong className="text-foreground">{don.studentName}</strong> ({don.studentEmail})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Claimed Condition: <span className="font-semibold text-foreground">{don.condition}</span> • Submitted: {formatDate(don.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                        "{don.description}"
                      </p>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center space-x-2 self-end md:self-center">
                    {don.status === 'PENDING' ? (
                      <>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setSelectedDonation(don);
                            setVerifiedCondition(don.condition);
                            setActionType('APPROVE');
                          }}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve & Award Points
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedDonation(don);
                            setActionType('REJECT');
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <div className="text-right space-y-1">
                        <Badge
                          variant={don.status === 'APPROVED' ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {don.status}
                        </Badge>
                        {don.pointsAwarded && (
                          <span className="block text-xs font-bold text-amber-700 dark:text-amber-400">
                            +{don.pointsAwarded} pts awarded
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review & Approve Modal */}
      <Dialog open={!!selectedDonation && !!actionType} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'APPROVE' ? 'Approve Book Donation' : 'Reject Book Donation'}
          </DialogTitle>
          <DialogDescription>
            {actionType === 'APPROVE'
              ? 'Verify condition, assign points, and auto-add book to the college inventory.'
              : 'Provide rejection rationale for the student.'}
          </DialogDescription>
        </DialogHeader>

        {selectedDonation && (
          <div className="space-y-3 py-2">
            <div className="p-3 bg-muted rounded-md space-y-1">
              <p className="text-xs font-semibold">{selectedDonation.title}</p>
              <p className="text-xs text-muted-foreground">Donor: {selectedDonation.studentName}</p>
            </div>

            {actionType === 'APPROVE' && (
              <div className="space-y-1">
                <label className="text-xs font-medium">Verified Physical Condition *</label>
                <select
                  value={verifiedCondition}
                  onChange={(e) => setVerifiedCondition(e.target.value as BookCondition)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="EXCELLENT">Excellent (+10 Impact Points)</option>
                  <option value="GOOD">Good (+7 Impact Points)</option>
                  <option value="ACCEPTABLE">Acceptable (+4 Impact Points)</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  The verified condition determines points added to student's Impact Score.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium">Librarian Review Note</label>
              <textarea
                className="w-full rounded-md border p-2 text-xs"
                rows={2}
                placeholder={actionType === 'APPROVE' ? 'e.g. Clean pages verified, accessioned to library.' : 'e.g. Water damaged, unreadable.'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setSelectedDonation(null)} disabled={processing}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={actionType === 'REJECT' ? 'destructive' : 'default'}
            onClick={handleAction}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Confirm Decision'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
