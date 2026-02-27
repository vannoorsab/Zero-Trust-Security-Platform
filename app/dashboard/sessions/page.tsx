'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Radio, Globe, Monitor, Download } from 'lucide-react';
import { getToken } from '@/lib/auth';

interface SessionItem {
  session_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  ip_address: string;
  device: string;
  start_time: string;
  last_activity: string;
  expires_at: string;
  login_attempt_count: number;
  risk_at_login: number;
  risk_score: number;
  location: string;
  action_count: number;
  download_count: number;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Update current time every second for live durations
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!getToken()) { router.push('/login'); return; }
        const data = await apiCall<SessionItem[]>('/api/admin/active-sessions');
        setSessions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const riskColor = (s: number) => {
    if (s > 0.6) return 'text-destructive';
    if (s > 0.3) return 'text-yellow-500';
    return 'text-green-500';
  };
  const riskBadge = (s: number) => {
    if (s > 0.6) return 'bg-destructive text-white';
    if (s > 0.3) return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Radio className="w-7 h-7 text-green-500 animate-pulse" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Sessions</h1>
            <p className="text-muted-foreground mt-1">{sessions.length} active sessions</p>
          </div>
        </div>

        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {sessions.map(s => (
            <Card key={s.session_id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.risk_score > 0.6 ? 'bg-destructive animate-pulse' : s.risk_score > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="font-semibold text-foreground">{s.user_name}</p>
                      <p className="text-xs text-muted-foreground">{s.user_email}</p>
                    </div>
                  </div>
                  <Badge className={riskBadge(s.risk_score)}>
                    Risk: {Math.round(s.risk_score * 100)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span>{s.ip_address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="w-3 h-3" />
                    <span className="truncate">{s.device || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Download className="w-3 h-3" />
                    <span>{s.download_count} downloads / {s.action_count} actions</span>
                  </div>
                  <div className="text-muted-foreground">
                    {s.location}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 md:gap-6">
                  <div>
                    <span className="font-semibold text-foreground/70">Session ID:</span> {s.session_id.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/70">Login Time (Started):</span> {new Date(s.start_time).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/70">Last Activity Time:</span> {new Date(s.last_activity).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/70 text-red-400">Logout Time (Scheduled):</span> {s.expires_at ? new Date(s.expires_at).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <span className={`font-semibold ${s.login_attempt_count > 1 ? 'text-yellow-500' : 'text-foreground/70'}`}>Login Attempts:</span> {s.login_attempt_count} {s.login_attempt_count > 1 ? '(Success after failures)' : '(First try)'}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/70">Duration:</span> {(() => {
                      const start = new Date(s.start_time).getTime();
                      const diffMs = now.getTime() - start;
                      const diffMins = Math.floor(diffMs / 60000);
                      const seconds = Math.floor((diffMs % 60000) / 1000);

                      if (diffMins >= 60) {
                        const h = Math.floor(diffMins / 60);
                        const m = diffMins % 60;
                        return `${h}h ${m}m ${seconds}s`;
                      } else if (diffMins >= 1) {
                        return `${diffMins}m ${seconds}s`;
                      } else {
                        return `${seconds}s`;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {sessions.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No active sessions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
