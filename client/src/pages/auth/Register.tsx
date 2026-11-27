import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    studentId: '',
    department: 'Computer Science & Engineering',
    academicYear: '1st Year',
    semester: '1st Semester',
    collegeAffiliation: 'School of Engineering & Technology',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid college email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.studentId.trim()) {
      setError('Please enter your official Student ID / Registration Number.');
      return;
    }

    setLoading(true);
    try {
      await registerStudent(formData);
      setSuccess(true);
      // Automatically redirect to Student Dashboard on completion
      setTimeout(() => {
        navigate('/student');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-foreground text-background items-center justify-center font-bold mb-2 shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Student Enrollment</h1>
          <p className="text-sm text-muted-foreground">College Identity & Library Card Registration</p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create your Student Account</CardTitle>
            <CardDescription>
              Enter your college enrollment details. You will automatically receive the Student role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-xs bg-destructive/15 text-destructive rounded-md border border-destructive/20 font-medium flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 font-medium flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Registration successful! Redirecting to Student Dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Full Name *</label>
                  <Input
                    name="fullName"
                    placeholder="e.g. Maya Patel"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">College Email *</label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="maya.patel@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Password *</label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Student ID / Registration No *</label>
                  <Input
                    name="studentId"
                    placeholder="e.g. CS-2024-055"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Department / Branch *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="Computer Science & Engineering">Computer Science</option>
                    <option value="Information Technology">Information Tech</option>
                    <option value="Electrical Engineering">Electrical Engg</option>
                    <option value="Mechanical Engineering">Mechanical Engg</option>
                    <option value="Civil Engineering">Civil Engg</option>
                    <option value="Sciences & Humanities">Sciences & Math</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Academic Year *</label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Semester *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="1st Semester">Sem 1</option>
                    <option value="2nd Semester">Sem 2</option>
                    <option value="3rd Semester">Sem 3</option>
                    <option value="4th Semester">Sem 4</option>
                    <option value="5th Semester">Sem 5</option>
                    <option value="6th Semester">Sem 6</option>
                    <option value="7th Semester">Sem 7</option>
                    <option value="8th Semester">Sem 8</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">College Affiliation / Campus</label>
                <Input
                  name="collegeAffiliation"
                  placeholder="e.g. University School of Engineering, Campus A"
                  value={formData.collegeAffiliation}
                  onChange={handleChange}
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Creating Student Account...' : 'Enroll & Open Student Dashboard'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-foreground underline underline-offset-4">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
