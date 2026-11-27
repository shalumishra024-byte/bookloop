import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { DonationRequest, BookCondition, ImpactPointsByCondition } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { HeartHandshake, Sparkles, Upload, CheckCircle2, Image as ImageIcon, BookOpen } from 'lucide-react';

export const StudentDonations: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    description: '',
    condition: 'EXCELLENT' as BookCondition,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadDonations = async () => {
    if (!user) return;
    setLoading(true);
    const data = await libraryService.getDonationRequests({ studentId: user.id });
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDonations();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.author || !formData.description) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await libraryService.createDonationRequest(
        {
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          images: [formData.imageUrl],
        },
        user.id
      );

      setFeedback('Donation submitted! The librarian will inspect the book photograph and approve points.');
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
        setFormData({
          title: '',
          author: '',
          isbn: '',
          category: 'Computer Science',
          description: '',
          condition: 'EXCELLENT',
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
        });
        loadDonations();
      }, 1500);
    } catch {
      setFeedback('Failed to submit donation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donate Books to the Library</h1>
          <p className="text-sm text-muted-foreground">
            Donate textbooks you no longer need. Approved donations increase your Impact Score!
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <HeartHandshake className="h-4 w-4 mr-1.5" />
          Submit Book Donation
        </Button>
      </div>

      {/* Impact Points Formula Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Excellent Condition</span>
            <Badge variant="success" className="font-mono text-xs">+10 pts</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Like new, no missing pages, tight binding, no heavy markings or creases.
          </p>
        </Card>

        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Good Condition</span>
            <Badge variant="warning" className="font-mono text-xs">+7 pts</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Minor edge wear, intact cover, legible pages, minimal pen or pencil notes.
          </p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Acceptable Condition</span>
            <Badge variant="secondary" className="font-mono text-xs">+4 pts</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Heavily read or marked, but complete and fully readable for students.
          </p>
        </Card>
      </div>

      {/* Donation History Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">My Donation Submissions</CardTitle>
          <CardDescription>
            Historical records of all books you submitted for college library intake
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading submissions...</div>
          ) : donations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              You haven't submitted any book donations yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {donations.map((don) => (
                <div key={don.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
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
                      <p className="text-xs text-muted-foreground">Author: {don.author} {don.category && `• ${don.category}`}</p>
                      <p className="text-xs text-muted-foreground">Claimed Condition: <strong>{don.condition}</strong></p>
                      {don.librarianNotes && (
                        <p className="text-xs text-muted-foreground italic bg-muted/50 p-1.5 rounded">
                          Librarian review: "{don.librarianNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {don.status === 'APPROVED' && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        +{don.pointsAwarded} Impact Points
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

      {/* Donation Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogHeader>
          <DialogTitle>Submit Book Donation</DialogTitle>
          <DialogDescription>
            Provide book information, verify its condition, and provide photographs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Book Title *</label>
            <Input
              placeholder="e.g. Clean Code"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Author(s) *</label>
              <Input
                placeholder="e.g. Robert C. Martin"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">ISBN (Optional)</label>
              <Input
                placeholder="e.g. 978-0132350884"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Networking">Networking</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Mathematics">Mathematics</option>
                <option value="General Engineering">General Engineering</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Book Condition *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as BookCondition })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              >
                <option value="EXCELLENT">Excellent (+10 pts)</option>
                <option value="GOOD">Good (+7 pts)</option>
                <option value="ACCEPTABLE">Acceptable (+4 pts)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Condition Notes / Description *</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background p-2 text-xs shadow-sm"
              rows={2}
              placeholder="Describe binding, pages, highlights or missing marks..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Book Photograph URL *</label>
            <Input
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              required
            />
            <p className="text-[11px] text-muted-foreground">The librarian will inspect this photograph before approving.</p>
          </div>

          {feedback && (
            <div className="p-2.5 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-md font-medium">
              {feedback}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Donation'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
