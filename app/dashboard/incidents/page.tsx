'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { getToken } from '@/lib/auth';

interface Incident {
  id: string;
  user_id: string;
  risk_level: string;
  incident_type: string;
  description: string;
  timestamp: string;
  action_taken: string;
  ai_explanation: string;
}

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const data = await apiCall<Incident[]>('/api/admin/incidents');
        setIncidents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load incidents');
      } finally {
        setIsLoading(false);
      }
    };

    loadIncidents();
  }, [router]);

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'critical':
        return 'bg-destructive text-white';
      case 'high':
        return 'bg-accent text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-primary text-primary-foreground';
    }
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Incident Log</h1>
          <p className="text-muted-foreground mt-1">Latest threats and anomalies detected</p>
        </div>

        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Incidents List */}
        <div className="space-y-3">
          {incidents.length > 0 ? (
            incidents.map((incident) => (
              <Card key={incident.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div
                  onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                  className="p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getRiskColor(incident.risk_level)}>
                          {incident.risk_level.toUpperCase()}
                        </Badge>
                        <p className="font-semibold text-foreground">{incident.incident_type}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        User ID: {incident.user_id} •{' '}
                        {new Date(incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${expandedId === incident.id ? 'transform rotate-180' : ''
                        }`}
                    />
                  </div>

                  {/* Expanded Content */}
                  {expandedId === incident.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          AI Analysis
                        </p>
                        <p className="text-sm text-foreground bg-secondary p-3 rounded-lg">
                          {incident.ai_explanation}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Action Taken
                          </p>
                          <Badge variant="outline" className="text-foreground">
                            {incident.action_taken}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                            Incident Type
                          </p>
                          <Badge variant="outline" className="text-foreground">
                            {incident.incident_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No incidents detected</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
