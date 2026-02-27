'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Bell, BellRing } from 'lucide-react';
import { getToken } from '@/lib/auth';

interface AlertItem {
  id: string;
  user_id: string;
  user_name: string;
  severity: string;
  status: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!getToken()) { router.push('/login'); return; }
        const data = await apiCall<AlertItem[]>('/api/admin/alerts');
        setAlerts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const sevColor = (s: string) => {
    if (s === 'critical') return 'bg-destructive text-white';
    if (s === 'high') return 'bg-accent text-white';
    if (s === 'medium') return 'bg-yellow-600 text-white';
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
          <BellRing className="w-7 h-7 text-destructive" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Alerts</h1>
            <p className="text-muted-foreground mt-1">Real-time threat notifications</p>
          </div>
          <Badge className="ml-auto bg-destructive text-white text-lg px-3 py-1">
            {alerts.filter(a => a.status === 'open').length} Open
          </Badge>
        </div>

        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {alerts.length > 0 ? alerts.map(a => (
            <Card key={a.id} className={`bg-card border-border ${a.severity === 'critical' ? 'border-l-4 border-l-destructive' : a.severity === 'high' ? 'border-l-4 border-l-accent' : ''}`}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {a.severity === 'critical' ? <BellRing className="w-5 h-5 text-destructive animate-pulse" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
                      <Badge className={sevColor(a.severity)}>{a.severity.toUpperCase()}</Badge>
                      <span className="text-sm font-semibold text-foreground">{a.user_name}</span>
                    </div>
                    <p className="text-sm text-foreground ml-8">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-2 ml-8">
                      {new Date(a.timestamp).toLocaleString()} &bull; Status: {a.status}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )) : (
            <Card className="bg-card border-border">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No alerts — system secure</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
