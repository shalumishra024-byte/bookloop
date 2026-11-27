import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { libraryService } from '@/services/libraryService';
import { QueueEntry } from '@college-library/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Sparkles, Clock, AlertCircle, Info, X } from 'lucide-react';

export const StudentQueue: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const loadQueue = async () => {
    if (!user) return;
    setLoading(true);
    const entries = await libraryService.getStudentQueueEntries(user.id);
    setQueueEntries(entries);
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, [user]);

  const handleLeaveQueue = async (queueId: string) => {
    if (!user) return;
    const ok = await libraryService.leaveQueue(queueId, user.id);
    if (ok) {
      setMsg('You have left the waiting queue.');
      setTimeout(() => setMsg(null), 3000);
      loadQueue();
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">Waiting Queue Priority</h1>
        <p className="text-sm text-muted-foreground">
          Transparent queue tracking for books currently checked out by other students
        </p>
      </div>

      {msg && (
        <div className="p-3 text-xs bg-muted text-foreground border rounded-md">
          {msg}
        </div>
      )}

      {/* Transparent Queue Formula Explanation Banner */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h4 className="text-sm font-semibold">How Queue Priority Works</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The college library prioritizes waiting queues using a fair 2-tier algorithm:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-md bg-muted/60 border text-xs space-y-1">
              <span className="font-semibold text-foreground">1. Primary Priority: Impact Score</span>
              <p className="text-muted-foreground">
                Students who contribute book donations earn Impact Points (10 / 7 / 4 pts) and receive priority for in-demand books.
              </p>
            </div>
            <div className="p-3 rounded-md bg-muted/60 border text-xs space-y-1">
              <span className="font-semibold text-foreground">2. Secondary Priority: Timestamp</span>
              <p className="text-muted-foreground">
                When students share the same Impact Score, First-Come-First-Serve (earlier request timestamp) decides priority order.
              </p>
            </div>
          </div>
          <div className="pt-1 text-xs text-muted-foreground">
            Your current Impact Score: <strong className="text-foreground">{studentProfile?.impactScore || 0} points</strong>.
          </div>
        </CardContent>
      </Card>

      {/* Active Queue Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">My Active Waiting Queues</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Loading queue positions...</div>
          ) : queueEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
              You are not currently in any waiting queues.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Queue Position</TableHead>
                  <TableHead>Students Ahead</TableHead>
                  <TableHead>Your Impact Score</TableHead>
                  <TableHead>Joined Time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueEntries.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-semibold text-xs">{q.bookTitle}</TableCell>
                    <TableCell>
                      <Badge variant={q.queuePosition === 1 ? 'success' : 'secondary'} className="text-xs font-mono font-bold">
                        #{q.queuePosition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {q.queuePosition === 1 ? 'Next to be assigned!' : `${q.queuePosition - 1} ahead`}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {q.impactScoreSnapshot} pts
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(q.requestTimestamp)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleLeaveQueue(q.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Leave Queue
                      </Button>
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
