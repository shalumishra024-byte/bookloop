import React, { useEffect, useState } from 'react';
import { libraryService } from '@/services/libraryService';
import { StudentProfile, User } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Search, Sparkles, GraduationCap } from 'lucide-react';

export const LibrarianStudents: React.FC = () => {
  const [students, setStudents] = useState<{ user: User; profile: StudentProfile }[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await libraryService.getStudentsList();
      setStudents(list);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = students.filter(s =>
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase()) ||
    s.profile.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.profile.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Registered Students Directory</h1>
        <p className="text-sm text-muted-foreground">
          View enrolled college students, verified roll numbers, department affiliations, and donation Impact Scores
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            placeholder="Search by student name, roll no, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Enrolled Students ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading student profiles...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              No students found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID / Roll No</TableHead>
                  <TableHead>Department / Branch</TableHead>
                  <TableHead>Year & Semester</TableHead>
                  <TableHead>Donation Impact Score</TableHead>
                  <TableHead>Active Loans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ user, profile }) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-xs block">{user.name}</span>
                        <span className="text-[11px] text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{profile.studentId}</TableCell>
                    <TableCell className="text-xs">{profile.department}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {profile.academicYear} • {profile.semester}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-700 dark:text-amber-400">
                        <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>{profile.impactScore} pts</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      {profile.activeBorrowingsCount} books
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
