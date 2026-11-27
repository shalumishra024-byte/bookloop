import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { libraryService } from '@/services/libraryService';
import { DonationRequest, BookCondition } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { Sparkles, Check, X, Image as ImageIcon, Eye, ShieldCheck } from 'lucide-react';

export const LibrarianDonations: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Inspection & Quality Verification modal state
  const [inspectDonation, setInspectDonation] = useState<DonationRequest | null>(null);
  const [verifiedCondition, setVerifiedCondition] = useState<BookCondition>('GOOD');
  const [verifiedRating, setVerifiedRating] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openInspection = (don: DonationRequest) => {
    setInspectDonation(don);
    setVerifiedCondition(don.condition);
    setVerifiedRating(don.verifiedQualityRating ?? don.studentQualityRating ?? 7);
    setNotes(don.librarianNotes || '');
    setErrorMsg(null);
  };

  const loadDonations = async () => {
    setLoading(true);
    try {
      const data = await libraryService.getDonationRequests();
      setDonations(data);

      // Auto-open specific request if navigated with ?inspect=<id>
      const inspectId = searchParams.get('inspect');
      if (inspectId) {
        const match = data.find((d) => d.id === inspectId);
        if (match) {
          openInspection(match);
        }
        setSearchParams({}, { replace: true });
      }
    } catch {
      setErrorMsg('Failed to load donation requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!inspectDonation) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      if (decision === 'APPROVE') {
        const ok = await libraryService.approveDonationRequest(
          inspectDonation.id,
          verifiedCondition,
          verifiedRating,
          notes || `Verified at ${verifiedRating}/10 by librarian.`
        );
        if (!ok) throw new Error('Failed to approve donation request.');
        setMsg(
          `Donation approved! Verified quality: ${verifiedRating}/10 (+${verifiedRating} Impact Points awarded and book added to catalog).`
        );
      } else {
        const ok = await libraryService.rejectDonationRequest(
          inspectDonation.id,
          notes || 'Did not meet library physical condition criteria.',
          verifiedRating
        );
        if (!ok) throw new Error('Failed to reject donation request.');
        setMsg('Donation request rejected (0 Impact Points awarded).');
      }
      setInspectDonation(null);
      setNotes('');
      await loadDonations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing donation request.');
    } finally {
      setProcessing(false);
      setTimeout(() => setMsg(null), 4500);
    }
  };

  const filteredDonations = donations.filter((d) =>
    filterStatus === 'ALL' ? true : d.status === filterStatus
  );

  const pendingCount = donations.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donation Requests & Quality Verification</h1>
          <p className="text-sm text-muted-foreground">
            Inspect student-submitted photographs, verify final quality rating (1–10), and award Impact Points
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? 'default' : 'outline'}
              className="text-xs h-8"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? `All (${donations.length})` : status === 'PENDING' ? `Pending (${pendingCount})` : status}
            </Button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="p-3 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-md font-medium">
          {msg}
        </div>
      )}

      {errorMsg && !inspectDonation && (
        <div className="p-3 text-xs bg-destructive/15 text-destructive border border-destructive/20 rounded-md font-medium">
          {errorMsg}
        </div>
      )}

      {/* Donations List */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">
            {filterStatus === 'ALL' ? 'All Donation Requests' : `${filterStatus} Donation Requests`} ({filteredDonations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading submissions...</div>
          ) : filteredDonations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No donation requests match this filter.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredDonations.map((don) => (
                <div key={don.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    {/* Photograph Thumbnail */}
                    <button
                      type="button"
                      onClick={() => openInspection(don)}
                      className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0 border hover:opacity-90 transition-opacity"
                      title="Click to inspect donation details & photos"
                    >
                      {don.images?.[0] ? (
                        <img src={don.images[0]} alt={don.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-30" />
                        </div>
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold leading-tight">{don.title}</h4>
                        {don.isDemo && (
                          <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
                            DEMO RECORD
                          </Badge>
                        )}
                        <Badge
                          variant={don.status === 'APPROVED' ? 'success' : don.status === 'REJECTED' ? 'destructive' : 'warning'}
                          className="text-[10px]"
                        >
                          {don.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Author: <strong>{don.author}</strong> {don.category && `• ${don.category}`} {don.isbn && `• ISBN: ${don.isbn}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Student Donor: <strong className="text-foreground">{don.studentName}</strong> ({don.studentEmail})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Condition: <span className="font-semibold text-foreground">{don.condition}</span> •
                        Student Rating: <span className="font-semibold text-foreground">{don.studentQualityRating ?? 7}/10</span> (Suggested: {don.suggestedPoints ?? 7} pts) •
                        Submitted: {formatDate(don.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                        "{don.description}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center flex-shrink-0">
                    {don.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => openInspection(don)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Inspect & Verify
                      </Button>
                    ) : (
                      <div className="text-right space-y-1">
                        {don.verifiedQualityRating !== undefined && (
                          <span className="block text-xs text-muted-foreground">
                            Verified: <strong>{don.verifiedQualityRating}/10</strong>
                          </span>
                        )}
                        {don.status === 'APPROVED' && don.pointsAwarded !== undefined && (
                          <span className="block text-xs font-bold text-amber-700 dark:text-amber-400">
                            +{don.pointsAwarded} pts awarded
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => openInspection(don)}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Donation Request Inspection & Book Quality Verification Modal */}
      <Dialog open={!!inspectDonation} onOpenChange={(open) => !open && setInspectDonation(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 pr-6">
            <DialogTitle>Donation Request Inspection</DialogTitle>
            {inspectDonation?.isDemo && (
              <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400">
                DEMO RECORD
              </Badge>
            )}
          </div>
          <DialogDescription>
            Inspect book details and photographs before assigning your verified quality rating.
          </DialogDescription>
        </DialogHeader>

        {inspectDonation && (
          <div className="space-y-4 py-1">
            {errorMsg && (
              <div className="p-2.5 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
                {errorMsg}
              </div>
            )}

            {/* Complete Book & Donor Details */}
            <div className="p-3 bg-muted/50 rounded-md border border-border space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{inspectDonation.title}</span>
                <Badge variant={inspectDonation.status === 'APPROVED' ? 'success' : inspectDonation.status === 'REJECTED' ? 'destructive' : 'warning'}>
                  {inspectDonation.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Author: <strong className="text-foreground">{inspectDonation.author}</strong>
                {inspectDonation.category && ` • Category: ${inspectDonation.category}`}
                {inspectDonation.isbn && ` • ISBN: ${inspectDonation.isbn}`}
              </p>
              <p className="text-muted-foreground">
                Donor: <strong className="text-foreground">{inspectDonation.studentName}</strong> ({inspectDonation.studentEmail})
              </p>
              <p className="text-muted-foreground pt-1">"{inspectDonation.description}"</p>
            </div>

            {/* Uploaded Book Photographs */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Uploaded Book Photographs ({inspectDonation.images?.length || 0})
              </label>
              {inspectDonation.images && inspectDonation.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {inspectDonation.images.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block border border-border rounded-md overflow-hidden bg-muted h-36 hover:opacity-90 transition-opacity"
                      title="Click to open full-size image"
                    >
                      <img src={imgUrl} alt={`${inspectDonation.title} photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                  No photographs uploaded by student.
                </div>
              )}
            </div>

            {/* Book Quality Verification Section */}
            <div className="p-3.5 rounded-md border border-border bg-card space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-foreground" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Book Quality Verification</h4>
                </div>
                <span className="text-[11px] text-muted-foreground">Librarian Authority Only</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded bg-muted/40">
                  <span className="text-muted-foreground block text-[11px]">Student Quality Rating (Suggested)</span>
                  <strong className="text-sm">{inspectDonation.studentQualityRating ?? 7} / 10</strong>
                  <span className="block text-[10px] text-muted-foreground">
                    Suggested: {inspectDonation.suggestedPoints ?? 7} pts
                  </span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <span className="text-muted-foreground block text-[11px]">Final Impact Points</span>
                  <div className="flex items-center gap-1 text-sm font-bold text-amber-700 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>
                      {inspectDonation.status === 'REJECTED'
                        ? '0 pts'
                        : inspectDonation.status === 'APPROVED'
                          ? `${inspectDonation.pointsAwarded ?? verifiedRating} pts`
                          : `${verifiedRating} pts`}
                    </span>
                  </div>
                  <span className="block text-[10px] text-muted-foreground">
                    From Librarian verified rating
                  </span>
                </div>
              </div>

              {inspectDonation.status === 'PENDING' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Verified Book Condition *</label>
                    <select
                      value={verifiedCondition}
                      onChange={(e) => setVerifiedCondition(e.target.value as BookCondition)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="ACCEPTABLE">Acceptable</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Librarian Final Verified Rating (1–10) *</label>
                      <span className="text-xs font-bold font-mono">{verifiedRating} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={verifiedRating}
                      onChange={(e) => setVerifiedRating(Number(e.target.value))}
                      className="w-full accent-foreground cursor-pointer"
                    />
                    <div className="grid grid-cols-10 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setVerifiedRating(num)}
                          className={`h-6 text-[11px] rounded border font-mono transition-colors ${
                            verifiedRating === num
                              ? 'bg-foreground text-background border-foreground font-bold'
                              : 'bg-background text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Librarian Review Note</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background p-2 text-xs"
                      rows={2}
                      placeholder="e.g. Inspected photos and physical copy; verified rating 7/10."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs space-y-1 pt-1">
                  <p>
                    Verified Condition: <strong>{inspectDonation.condition}</strong> • Librarian Verified Rating:{' '}
                    <strong>{inspectDonation.verifiedQualityRating ?? '-'}/10</strong>
                  </p>
                  {inspectDonation.librarianNotes && (
                    <p className="text-muted-foreground italic">Note: "{inspectDonation.librarianNotes}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setInspectDonation(null)} disabled={processing}>
            Close
          </Button>
          {inspectDonation?.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDecision('REJECT')}
                disabled={processing}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {processing ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDecision('APPROVE')}
                disabled={processing}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {processing ? 'Processing...' : `Approve & Award ${verifiedRating} pts`}
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
};
