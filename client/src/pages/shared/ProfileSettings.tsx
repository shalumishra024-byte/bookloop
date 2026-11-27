import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, GraduationCap, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, studentProfile, updateStudentProfile, role } = useAuth();
  const isLibrarian = role === 'LIBRARIAN';

  const [formData, setFormData] = useState({
    studentId: studentProfile?.studentId || '',
    department: studentProfile?.department || '',
    academicYear: studentProfile?.academicYear || '',
    semester: studentProfile?.semester || '',
    collegeAffiliation: studentProfile?.collegeAffiliation || '',
  });

  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLibrarian && studentProfile) {
      updateStudentProfile(formData);
      setMsg('Profile updated successfully.');
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Account & College Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your account identity, institutional affiliation, and credentials
        </p>
      </div>

      {msg && (
        <div className="p-3 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-md font-medium">
          {msg}
        </div>
      )}

      {/* Identity Card */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-base">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div>
                <CardTitle className="text-base">{user?.name}</CardTitle>
                <CardDescription className="text-xs">{user?.email}</CardDescription>
              </div>
            </div>
            <Badge variant={isLibrarian ? 'default' : 'secondary'} className="text-xs font-mono">
              {role}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Student College Verification Details */}
      {!isLibrarian && studentProfile && (
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">College Verification Information</CardTitle>
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
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Student ID / Roll No</label>
                  <Input
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Department / Branch</label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Academic Year</label>
                  <Input
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Semester</label>
                  <Input
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">College Affiliation / School</label>
                <Input
                  value={formData.collegeAffiliation}
                  onChange={(e) => setFormData({ ...formData, collegeAffiliation: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security & Password */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Security & Password</CardTitle>
          <CardDescription className="text-xs">
            Manage your password and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Current Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">New Password</label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="text-xs">
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
