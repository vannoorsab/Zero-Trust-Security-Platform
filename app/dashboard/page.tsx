'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useApi, apiCall } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  AlertCircle,
  Zap,
  Activity,
  Loader2,
} from 'lucide-react';
import { getToken } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

interface DashboardMetrics {
  total_users: number;
  active_users: number;
  critical_risks: number;
  suspicious_sessions: number;
  blocked_accounts: number;
  recent_alerts: number;
  incidents_24h: number;
  avg_risk_score: number;
  attack_attempts: number;
  resolved_by_admin: number;
  top_risks: Array<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    risk_score: number;
    risk_level: string;
    access_level: string;
  }>;
}

interface RiskHistoryEntry {
  old_score: number;
  new_score: number;
  delta: number;
  factors: Array<{ factor: string; weight: number }>;
  timestamp: string;
  triggered_by: string;
}

interface UserSession {
  session_id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  start_time: string;
  expires_at: string;
  login_attempt_count: number;
  mfa_verified: boolean;
  revoked: boolean;
}

interface UserDetailAnalytics {
  recent_logs: Array<{
    id: string;
    app_id: string;
    action: string;
    details?: string;
    duration?: number;
    metadata: any;
    timestamp: string;
  }>;
  most_used_module: string | null;
  module_durations: Record<string, number>;
}

interface UserProfile {
  role: string;
}

const mockChartData = [
  { time: '00:00', incidents: 2, alerts: 4 },
  { time: '04:00', incidents: 3, alerts: 6 },
  { time: '08:00', incidents: 1, alerts: 3 },
  { time: '12:00', incidents: 5, alerts: 8 },
  { time: '16:00', incidents: 3, alerts: 5 },
  { time: '20:00', incidents: 4, alerts: 7 },
  { time: '24:00', incidents: 2, alerts: 4 },
];

const riskDistribution = [
  { name: 'Low', value: 60, color: '#00ff00' },
  { name: 'Medium', value: 25, color: '#ffa500' },
  { name: 'High', value: 10, color: '#ff1493' },
  { name: 'Critical', value: 5, color: '#ff4444' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lastSimResult, setLastSimResult] = useState<any>(null);

  // Analytics State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [riskHistory, setRiskHistory] = useState<RiskHistoryEntry[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [activityAnalytics, setActivityAnalytics] = useState<UserDetailAnalytics | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update current time every second for live durations
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMetrics = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const metricsData = await apiCall<DashboardMetrics>('/api/admin/dashboard');
      setMetrics(metricsData);

      // Update selected user if currently investigating
      if (selectedUser && metricsData.top_risks) {
        const updated = metricsData.top_risks.find(r => r.user_id === selectedUser.user_id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string, silent = false) => {
    if (!silent) setIsDetailLoading(true);
    try {
      const [history, sessions, analytics] = await Promise.all([
        apiCall<RiskHistoryEntry[]>(`/api/admin/user/${userId}/risk-history`),
        apiCall<UserSession[]>(`/api/admin/user/${userId}/sessions`),
        apiCall<UserDetailAnalytics>(`/api/admin/user/${userId}/activity-analytics`)
      ]);
      setRiskHistory(history.length > 0 ? history : [{
        old_score: 0,
        new_score: 0,
        delta: 0,
        factors: [],
        timestamp: new Date().toISOString(),
        triggered_by: 'system_baseline'
      }]);
      setUserSessions(sessions);
      setActivityAnalytics(analytics);
    } catch (err) {
      if (!silent) {
        toast({
          title: "Failed to load user details",
          description: err instanceof Error ? err.message : 'Loading failed',
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const profileData = await apiCall<UserProfile>('/api/user/profile');
        setProfile(profileData);
        setIsAuthorized(true);

        await fetchMetrics();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth failed');
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  // Real-time Polling Effect
  useEffect(() => {
    if (!isAuthorized) return;

    const metricsInterval = setInterval(() => fetchMetrics(true), 5000);

    let userInterval: NodeJS.Timeout | null = null;
    if (selectedUser) {
      userInterval = setInterval(() => fetchUserDetails(selectedUser.user_id, true), 3000);
    }

    return () => {
      clearInterval(metricsInterval);
      if (userInterval) clearInterval(userInterval);
    };
  }, [isAuthorized, selectedUser]);

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    fetchUserDetails(user.user_id);
  };

  const handleAdminAction = async (userId: string, action: string) => {
    try {
      await apiCall(`/api/admin/user/${userId}/action`, {
        method: 'POST',
        body: {
          action,
          reason: `Admin manual action: ${action}`
        }
      });
      toast({
        title: "Action Successful",
        description: `Successfully executed ${action}`,
      });
      // Refresh details
      if (selectedUser?.user_id === userId) {
        const updatedLevel = action === 'lock_account' ? 'blocked' : action === 'unblock' ? 'full' : selectedUser.access_level;
        const updatedUser = { ...selectedUser, access_level: updatedLevel };
        setSelectedUser(updatedUser);
        handleUserSelect(updatedUser);
      }
      // Refresh metrics
      const metricsData = await apiCall<DashboardMetrics>('/api/admin/dashboard');
      setMetrics(metricsData);
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : 'Action failed',
        variant: "destructive",
      });
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await apiCall<any>('/api/demo/simulate-attack', { method: 'POST', body: {} });
      setLastSimResult(result);

      toast({
        title: "Attack Simulation Complete",
        description: `Target: ${result.target_user?.name}. Risk Score: ${result.risk_result?.score}/100. ${result.action_taken}`,
        variant: 'destructive',
      });

      const metricsData = await apiCall<DashboardMetrics>('/api/admin/dashboard');
      setMetrics(metricsData);
    } catch (err) {
      toast({
        title: "Simulation Failed",
        description: err instanceof Error ? err.message : 'Simulation failed',
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
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
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-1">Real-time threat monitoring and analysis</p>
          </div>
          <Button
            onClick={handleSimulate}
            disabled={isSimulating}
            variant="destructive"
            className="font-semibold"
          >
            {isSimulating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSimulating ? 'Running Attack...' : 'Simulate Attack'}
          </Button>
        </div>

        {error && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Section 1: Overview Intelligence Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Intelligence Overview
          </h2>

          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card className="bg-card border-border border-l-4 border-l-blue-500">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Users</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{metrics.total_users}</div>
                  <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> {metrics.active_users} active now
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-l-4 border-l-yellow-500">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Suspicious Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{metrics.suspicious_sessions}</div>
                  <div className="text-xs text-yellow-500 mt-1">High-risk login detected</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-l-4 border-l-destructive">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Critical Risks</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-destructive">{metrics.critical_risks}</div>
                  <div className="text-xs text-muted-foreground mt-1">Requiring immediate action</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-l-4 border-l-accent">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{metrics.recent_alerts}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total flags in last 24h</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border border-l-4 border-l-slate-500">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Blocked Accounts</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{metrics.blocked_accounts}</div>
                  <div className="text-xs text-muted-foreground mt-1">Temporary or restricted</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border border-l-4 border-l-purple-500">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Attack Attempts</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold text-purple-400">{metrics.attack_attempts}</div>
                  <div className="text-xs text-muted-foreground mt-1">Detected & blocked</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Top Risks & Selection */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  High Risk Monitoring
                  <Badge variant="outline" className="text-xs font-normal">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.top_risks.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedUser?.user_id === user.user_id
                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                        : 'bg-secondary/50 border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{user.name}</p>
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize font-normal border-primary/30 text-primary/80">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate w-48">{user.email}</p>
                      </div>
                      <Badge
                        className={`${user.risk_level === 'critical' ? 'bg-destructive' :
                          user.risk_level === 'high' ? 'bg-accent' : 'bg-yellow-600'
                          }`}
                      >
                        {Math.round(user.risk_score * 100)}%
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Section 2 - Deep Risk Analytics */}
          <div className="lg:col-span-8">
            {selectedUser ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      Investigation: {selectedUser.name}
                      {selectedUser.risk_level === 'critical' && <AlertCircle className="text-destructive h-6 w-6" />}
                    </h2>
                    <div className="flex items-center gap-3">
                      <p className="text-muted-foreground">{selectedUser.email}</p>
                      <Badge variant="outline" className="capitalize border-primary/30 text-primary bg-primary/5">
                        {selectedUser.role}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1.5 flex items-center">
                        <Zap className="w-3 h-3" />
                        {metrics?.resolved_by_admin || 0} Resolved by Admin
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAdminAction(selectedUser.user_id, 'force_logout')}>
                      Force Logout
                    </Button>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAdminAction(selectedUser.user_id, 'resolve_incident')}>
                      Mark Resolved
                    </Button>
                    {selectedUser.access_level === 'blocked' ? (
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAdminAction(selectedUser.user_id, 'unblock')}>
                        Unlock Account
                      </Button>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => handleAdminAction(selectedUser.user_id, 'lock_account')}>
                        Lock Account
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => handleAdminAction(selectedUser.user_id, 'mark_safe')}>
                      Mark Safe
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risk Trend Chart */}
                  <Card className="bg-card border-border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Risk Trend History</CardTitle>
                    </CardHeader>
                    <CardContent className="h-48 p-2">
                      {isDetailLoading ? (
                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...riskHistory].reverse().map(h => {
                            // Safely convert to percentage, handling if it's already 0-100 or 0.0-1.0
                            const nScore = h.new_score <= 1.0 && h.new_score > 0 ? Math.round(h.new_score * 100) : h.new_score;
                            const oScore = h.old_score <= 1.0 && h.old_score > 0 ? Math.round(h.old_score * 100) : h.old_score;
                            return {
                              ...h,
                              new_score: nScore,
                              old_score: oScore
                            };
                          })}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis
                              domain={[0, 100]}
                              width={30}
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: '#666' }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }}
                              labelFormatter={(val) => new Date(val).toLocaleString()}
                              formatter={(value: any) => [`${value}%`, 'Risk Score']}
                            />
                            <Line
                              type="monotone"
                              dataKey="new_score"
                              stroke="#00d9ff"
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#00d9ff', strokeWidth: 0 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Sessions */}
                  <Card className="bg-card border-border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Active Sessions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {userSessions.map((s) => {
                          const start = new Date(s.start_time).getTime();
                          const diffMs = now.getTime() - start;
                          const diffMins = Math.floor(diffMs / 60000);
                          const seconds = Math.floor((diffMs % 60000) / 1000);

                          let duration = '';
                          if (diffMins >= 60) {
                            const h = Math.floor(diffMins / 60);
                            const m = diffMins % 60;
                            duration = `${h}h ${m}m ${seconds}s`;
                          } else if (diffMins >= 1) {
                            duration = `${diffMins}m ${seconds}s`;
                          } else {
                            duration = `${seconds}s`;
                          }

                          return (
                            <div key={s.session_id} className="text-xs p-3 bg-secondary/30 rounded-lg border border-border flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-mono text-primary/80">{s.ip_address}</p>
                                  <p className="text-muted-foreground mt-0.5 truncate max-w-[150px]" title={s.user_agent}>{s.user_agent || 'Unknown Device'}</p>
                                </div>
                                {s.mfa_verified && <Badge variant="outline" className="text-[10px] text-green-500 border-green-500 bg-green-500/10">MFA</Badge>}
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-border/50 text-muted-foreground">
                                <div>
                                  <span className="block text-[10px] uppercase text-foreground/50 mb-0.5">Login Time</span>
                                  {new Date(s.start_time).toLocaleTimeString()}
                                </div>
                                <div>
                                  <span className="block text-[10px] uppercase text-foreground/50 mb-0.5">Duration</span>
                                  {duration}
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-muted-foreground">
                                <div>
                                  <span className="block text-[10px] uppercase text-red-400/70 mb-0.5">Logout Time (Scheduled)</span>
                                  {s.expires_at ? new Date(s.expires_at).toLocaleString([], {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                  }) : 'N/A'}
                                </div>
                                <div>
                                  <span className={`block text-[10px] uppercase mb-0.5 ${s.login_attempt_count > 1 ? 'text-yellow-500' : 'text-foreground/50'}`}>Attempts</span>
                                  {s.login_attempt_count} {s.login_attempt_count > 1 ? '(Brute-force Risk)' : '(First try)'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {userSessions.length === 0 && (
                          <div className="text-center text-muted-foreground text-xs py-4">No active sessions</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Real-time Activity Intelligence */}
                <Card className="bg-card border-border border-t-4 border-t-sky-500 shadow-lg">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-md flex items-center gap-2">
                      <Activity className="w-5 h-5 text-sky-500" />
                      Real-time Activity Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {/* Insights Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-xl border-2 transition-all ${activityAnalytics?.most_used_module ? 'border-sky-500 bg-sky-50 shadow-sm scale-[1.02]' : 'border-border bg-muted/30'}`}>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Most Frequent Module</p>
                        <p className={`text-4xl font-black tracking-wider ${activityAnalytics?.most_used_module ? 'text-sky-900 drop-shadow-sm' : 'text-foreground'}`}>
                          {activityAnalytics?.most_used_module ? activityAnalytics.most_used_module.replace('app_', '').toUpperCase() : 'PENDING'}
                        </p>
                        {activityAnalytics?.most_used_module && (
                          <Badge className="mt-2 bg-sky-500 hover:bg-sky-600 animate-pulse">MOST ACTIVE</Badge>
                        )}
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-muted/20 md:col-span-2">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Detailed Usage Dwell Time</p>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(activityAnalytics?.module_durations || {}).map(([mod, dur]) => (
                            <div key={mod} className="flex flex-col gap-1 items-center px-4 py-2 bg-background rounded-lg border border-border/50">
                              <span className="text-[10px] text-muted-foreground">{mod.replace('app_', '').toUpperCase()}</span>
                              <span className="text-sm font-mono font-bold text-sky-600">{Math.round(dur / 60)}m {Math.round(dur % 60)}s</span>
                            </div>
                          ))}
                          {(!activityAnalytics || Object.keys(activityAnalytics.module_durations).length === 0) && (
                            <p className="text-xs text-muted-foreground italic">No dwell time data recorded.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Table */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Real-time Activity Timeline</h4>
                      <div className="relative border border-border rounded-lg overflow-hidden bg-muted/10">
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-500/20">
                          <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm shadow-sm">
                              <tr>
                                <th className="px-3 py-2 text-muted-foreground font-medium">Activity</th>
                                <th className="px-3 py-2 text-muted-foreground font-medium">Module</th>
                                <th className="px-3 py-2 text-muted-foreground font-medium">Recorded At</th>
                                <th className="px-3 py-2 text-muted-foreground font-medium">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {activityAnalytics?.recent_logs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/50 transition-colors group">
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${log.action === 'enter_module' ? 'bg-green-500' :
                                        log.action === 'exit_module' ? 'bg-red-500' :
                                          log.action.includes('Download') || log.details?.includes('FILE:') ? 'bg-amber-500' : 'bg-sky-400'
                                        }`} />
                                      <span className="font-medium text-foreground capitalize">
                                        {log.action.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge variant="outline" className="text-[9px] font-mono border-muted text-muted-foreground group-hover:border-sky-200 group-hover:text-sky-600">
                                      {log.app_id.replace('app_', '').toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`text-[10px] leading-tight ${log.details?.includes('FILE:') ? 'font-mono text-amber-600 bg-amber-50 px-1 rounded' : 'text-muted-foreground italic'}`}>
                                      {log.details || '-'}
                                    </span>
                                    {log.duration && (
                                      <span className="ml-2 text-sky-500 font-bold">[{Math.round(log.duration)}s dwell]</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {(!activityAnalytics || activityAnalytics.recent_logs.length === 0) && (
                                <tr>
                                  <td colSpan={4} className="text-center py-12 text-muted-foreground opacity-30 italic">No activity signals captured yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors Breakdown */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-md">Risk Factor Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {riskHistory[0]?.factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex-1 text-sm">{f.factor.replace(/_/g, ' ')}</div>
                          <div className="w-48 bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-accent h-full"
                              style={{ width: `${Math.min(100, f.weight * 2)}%` }}
                            />
                          </div>
                          <div className="text-xs font-mono">+{f.weight}</div>
                        </div>
                      ))}
                      {!riskHistory[0]?.factors.length && <p className="text-sm text-muted-foreground italic text-center">No anomalies detected in last recalculation.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="bg-card border-border flex flex-col items-center justify-center p-12 text-center">
                  <div className="bg-primary/10 p-6 rounded-full mb-4">
                    <Activity className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Deep Risk Analytics</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Select a user from the monitoring list to investigate.
                  </p>
                </Card>

                {lastSimResult && (
                  <Card className="bg-card border-border border-l-4 border-l-destructive">
                    <CardHeader>
                      <CardTitle className="text-md flex items-center gap-2">
                        <AlertTriangle className="text-destructive h-5 w-5" />
                        Last Attack Simulation Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Target:</span> <span className="font-semibold">{lastSimResult.target_user?.name}</span></div>
                        <div><span className="text-muted-foreground">Risk Score:</span> <span className="font-bold text-destructive">{lastSimResult.risk_result?.score}/100</span></div>
                        <div><span className="text-muted-foreground">Attack IP:</span> <span className="font-mono text-xs">{lastSimResult.attack_details?.ip_address}</span></div>
                        <div><span className="text-muted-foreground">Decision:</span> <span className="font-semibold text-destructive">{lastSimResult.risk_result?.decision}</span></div>
                        <div><span className="text-muted-foreground">Downloads:</span> {lastSimResult.attack_details?.downloads}</div>
                        <div><span className="text-muted-foreground">Login Hour:</span> {lastSimResult.attack_details?.login_hour}</div>
                      </div>
                      {lastSimResult.risk_result?.breakdown && (
                        <div className="space-y-2 mt-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Risk Breakdown (Explainable AI)</p>
                          {lastSimResult.risk_result.breakdown.map((b: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${b.status === 'critical' ? 'bg-destructive' : b.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                              <div className="flex-1 text-xs">{b.factor.replace(/_/g, ' ')}</div>
                              <div className="w-32 bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${b.status === 'critical' ? 'bg-destructive' : b.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, b.raw_risk)}%` }} />
                              </div>
                              <div className="text-xs font-mono w-12 text-right">{b.raw_risk}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">{lastSimResult.action_taken}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
