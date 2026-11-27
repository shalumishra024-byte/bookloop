import React, { useEffect, useState } from 'react';
import { libraryService } from '@/services/libraryService';
import { Book, BookSource } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen, Search, HeartHandshake } from 'lucide-react';

export const LibrarianBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    description: '',
    totalCopies: 3,
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=600',
    source: 'LIBRARY' as BookSource,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadBooks = async () => {
    setLoading(true);
    const data = await libraryService.getBooks({ search });
    setBooks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBooks();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await libraryService.createBook({
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        description: formData.description,
        totalCopies: Number(formData.totalCopies),
        coverImage: formData.coverImage,
        source: formData.source,
        status: 'AVAILABLE',
      });
      setIsModalOpen(false);
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: 'Computer Science',
        description: '',
        totalCopies: 3,
        coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&q=80&w=600',
        source: 'LIBRARY',
      });
      loadBooks();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library Book Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage catalog collection, add new acquisitions, and maintain copy counts
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add New Book
        </Button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            placeholder="Search catalog by title, author, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">All Books Catalog ({books.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading catalog...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title & Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Total Copies</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="space-y-0.5 max-w-[280px]">
                        <span className="font-semibold text-xs block leading-tight">{b.title}</span>
                        <span className="text-[11px] text-muted-foreground">by {b.author}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{b.category}</TableCell>
                    <TableCell>
                      {b.source === 'DONATION' ? (
                        <Badge variant="secondary" className="text-[10px]">
                          <HeartHandshake className="h-3 w-3 mr-1 text-rose-500" />
                          Donation
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Library Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold">{b.totalCopies}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {b.availableCopies}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={b.availableCopies > 0 ? 'success' : 'destructive'}
                        className="text-[10px]"
                      >
                        {b.availableCopies > 0 ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add New Book Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogHeader>
          <DialogTitle>Add New Book to Collection</DialogTitle>
          <DialogDescription>
            Register a new book title and generate initial physical copies
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Book Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Author(s) *</label>
              <Input
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">ISBN</label>
              <Input
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Category *</label>
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
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Total Physical Copies *</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <textarea
              className="w-full rounded-md border p-2 text-xs"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Book'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
