import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Sparkles, GraduationCap, Building2 } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, studentProfile, librarianProfile, updateStudentProfile, updateLibrarianProfile, role } = useAuth();
  const isLibrarian = role === 'LIBRARIAN';

  const [studentForm, setStudentForm] = useState({
    studentId: '',
    department: '',
    academicYear: '',
    semester: '',
    collegeAffiliation: '',
  });

  const [librarianForm, setLibrarianForm] = useState({
    designation: '',
    libraryName: '',
    department: '',
  });

  useEffect(() => {
    if (studentProfile) {
      setStudentForm({
        studentId: studentProfile.studentId || '',
        department: studentProfile.department || '',
        academicYear: studentProfile.academicYear || '',
        semester: studentProfile.semester || '',
        collegeAffiliation: studentProfile.collegeAffiliation || '',
      });
    }
  }, [studentProfile]);

  useEffect(() => {
    if (librarianProfile) {
      setLibrarianForm({
        designation: librarianProfile.designation || '',
        libraryName: librarianProfile.libraryName || '',
        department: librarianProfile.department || '',
      });
    }
  }, [librarianProfile]);

  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLibrarian || !studentProfile) return;
    setSaving(true);
    setError(null);
    try {
      await updateStudentProfile(studentForm);
      setMsg('Student profile updated successfully.');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLibrarian) return;
    setSaving(true);
    setError(null);
    try {
      await updateLibrarianProfile(librarianForm);
      setMsg('Librarian profile updated successfully.');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update librarian profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">
          {isLibrarian ? 'Librarian Account Profile' : 'Student Account Profile'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLibrarian
            ? 'Your library authority credentials, designation, and institutional assignment'
            : 'View and manage your verified student identity and academic enrollment details'}
        </p>
      </div>

      {msg && (
        <div className="p-3 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-md font-medium">
          {msg}
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-md font-medium">
          {error}
        </div>
      )}

      {/* Identity Card (Role-specific summary) */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-base">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <CardTitle className="text-base">{user?.name}</CardTitle>
                <CardDescription className="text-xs">{user?.email}</CardDescription>
              </div>
            </div>
            <Badge variant={isLibrarian ? 'default' : 'secondary'} className="text-xs font-mono flex items-center gap-1">
              {isLibrarian ? <ShieldCheck className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
              <span>{role}</span>
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* STUDENT PROFILE VIEW */}
      {!isLibrarian && studentProfile && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Student Academic Information</CardTitle>
                <CardDescription className="text-xs">
                  Your academic enrollment details verified with the college registrar
                </CardDescription>
              </div>
              <div className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>Impact Score: {studentProfile.impactScore} pts</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Student ID / Roll No</label>
                  <Input
                    value={studentForm.studentId}
                    onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Department / Branch</label>
                  <Input
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Academic Year</label>
                  <Input
                    value={studentForm.academicYear}
                    onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Semester</label>
                  <Input
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">College / School Affiliation</label>
                <Input
                  value={studentForm.collegeAffiliation}
                  onChange={(e) => setStudentForm({ ...studentForm, collegeAffiliation: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
                <div>Total Approved Donations: <strong className="text-foreground">{studentProfile.totalDonations}</strong></div>
                <div>Active Borrowings: <strong className="text-foreground">{studentProfile.activeBorrowingsCount}</strong></div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* LIBRARIAN PROFILE VIEW (Strictly no student academic fields) */}
      {isLibrarian && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Library Authority Details</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Administrative credentials and institutional library assignment
                </CardDescription>
              </div>
              {librarianProfile?.librarianId && (
                <Badge variant="outline" className="font-mono text-xs">
                  ID: {librarianProfile.librarianId}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveLibrarian} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Librarian ID</label>
                  <Input
                    value={librarianProfile?.librarianId || 'LIB-2024-001'}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Designation</label>
                  <Input
                    value={librarianForm.designation}
                    onChange={(e) => setLibrarianForm({ ...librarianForm, designation: e.target.value })}
                    placeholder="e.g. Chief University Librarian"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Library / Institution Name</label>
                  <Input
                    value={librarianForm.libraryName}
                    onChange={(e) => setLibrarianForm({ ...librarianForm, libraryName: e.target.value })}
                    placeholder="e.g. Central Academic Library"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Division / Department</label>
                  <Input
                    value={librarianForm.department}
                    onChange={(e) => setLibrarianForm({ ...librarianForm, department: e.target.value })}
                    placeholder="e.g. Library & Information Services"
                  />
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
                Role: <strong className="text-foreground">LIBRARIAN</strong> — Authorized to manage inventory, approve/reject borrow requests, issue/return physical copies, and inspect student book donations.
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Authority Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
