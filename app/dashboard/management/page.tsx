'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiCall } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, PlusCircle, Network, KeyRound, Clock, Activity } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

export default function ManagementPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [apps, setApps] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Form States
    const [appName, setAppName] = useState('');
    const [appDesc, setAppDesc] = useState('');

    const [credAppId, setCredAppId] = useState('');
    const [credUserId, setCredUserId] = useState('');
    const [credUsername, setCredUsername] = useState('');
    const [credPassword, setCredPassword] = useState('');

    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');

    const [windowUserId, setWindowUserId] = useState('');
    const [windowAppId, setWindowAppId] = useState('');
    const [windowStart, setWindowStart] = useState('09:00');
    const [windowEnd, setWindowEnd] = useState('17:00');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Auto-generate credentials
    const generateRandomCreds = () => {
        const adjectives = ['secure', 'cyber', 'cryptic', 'shielded', 'vault', 'iron', 'proxy', 'node'];
        const nouns = ['user', 'access', 'token', 'link', 'client', 'agent', 'auth', 'key'];
        const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const newUsername = `${rand(adjectives)}_${rand(nouns)}_${Math.floor(Math.random() * 999)}`;
        const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase() + "!";
        setCredUsername(newUsername);
        setCredPassword(newPassword);
    };

    // Auto-generate when selections change
    useEffect(() => {
        if (credAppId && credUserId && !credUsername) {
            generateRandomCreds();
        }
    }, [credAppId, credUserId]);

    useEffect(() => {
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }
            const appsData = await apiCall<any[]>('/api/admin/apps');
            const usersData = await apiCall<any[]>('/api/admin/users');
            setApps(appsData);
            setUsers(usersData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load initial data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateApp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingForm(true);
        try {
            await apiCall('/api/admin/apps', {
                method: 'POST',
                body: { name: appName, description: appDesc, url: `https://${appName.toLowerCase().replace(/ /g, '')}.internal` }
            });
            toast({ title: "Success", description: "Application created successfully" });
            setAppName(''); setAppDesc('');
            loadData();
        } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : 'Failed to create app', variant: "destructive" });
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleCreateCredential = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingForm(true);
        try {
            await apiCall(`/api/admin/app/${credAppId}/user`, {
                method: 'POST',
                body: { user_id: credUserId, username: credUsername, password: credPassword }
            });
            const selectedUser = users.find(u => u.id === credUserId);
            const selectedApp = apps.find(a => a.id === credAppId);

            toast({ title: "Success", description: "Credentials assigned successfully" });
            setSuccessMessage(`Access granted for ${selectedUser?.name} to ${selectedApp?.name}. Credentials generated and notification email sent to ${selectedUser?.email}.`);

            setCredUserId(''); setCredUsername(''); setCredPassword('');
            loadData();

            // Clear message after 10 seconds
            setTimeout(() => setSuccessMessage(null), 10000);
        } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : 'Failed to assign credentials', variant: "destructive" });
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingForm(true);
        try {
            await apiCall('/api/auth/register', {
                method: 'POST',
                body: { name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }
            });
            toast({ title: "Success", description: "User created successfully" });
            setSuccessMessage(`Entity Created: ${newUserName} (${newUserEmail}) has been successfully registered.`);
            setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
            loadData();

            // Clear message after 10 seconds
            setTimeout(() => setSuccessMessage(null), 10000);
        } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : 'Failed to create user', variant: "destructive" });
        } finally {
            setIsLoadingForm(false);
        }
    };

    const handleCreateLoginWindow = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingForm(true);
        try {
            await apiCall('/api/admin/login-windows', {
                method: 'POST',
                body: { user_id: windowUserId, app_id: windowAppId, allowed_start: windowStart, allowed_end: windowEnd }
            });
            toast({ title: "Success", description: "Login window defined successfully" });
            setWindowUserId(''); setWindowAppId('');
            loadData();
        } catch (err) {
            toast({ title: "Error", description: err instanceof Error ? err.message : 'Failed to define login window', variant: "destructive" });
        } finally {
            setIsLoadingForm(false);
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
            <div className="space-y-6 max-w-5xl mx-auto pb-12">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-foreground">Access Management</h1>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </div>

                {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <PlusCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-500">Assignment Confirmed</p>
                            <p className="text-xs text-muted-foreground mt-1">{successMessage}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert className="border-destructive bg-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Create User */}
                    <Card className="bg-card border-border md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-green-500" />
                                Create New Account
                            </CardTitle>
                            <CardDescription>Register a new administrator or standard user for the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input
                                            placeholder="Jane Doe"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                            required
                                            className="bg-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="jane@example.com"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            required
                                            className="bg-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                            required
                                            className="bg-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Role</Label>
                                        <select
                                            value={newUserRole}
                                            onChange={(e) => setNewUserRole(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                        >
                                            <option value="admin">Platform Administrator</option>
                                            <option value="user">Standard User</option>
                                        </select>
                                    </div>
                                </div>
                                <Button type="submit" disabled={isLoadingForm || !newUserName || !newUserEmail || !newUserPassword} variant="outline" className="w-full mt-4 border-green-500/50 hover:bg-green-500/10 text-green-500">
                                    {isLoadingForm ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                    Create Entity
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Create Application */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Network className="w-5 h-5 text-primary" />
                                Register Application
                            </CardTitle>
                            <CardDescription>Register a new service to allow access rules.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateApp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="appName">Application Name</Label>
                                    <Input
                                        id="appName"
                                        placeholder="e.g. Accounting Dashboard"
                                        value={appName}
                                        onChange={(e) => setAppName(e.target.value)}
                                        required
                                        className="bg-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="appDesc">Description</Label>
                                    <Input
                                        id="appDesc"
                                        placeholder="Brief description of the service"
                                        value={appDesc}
                                        onChange={(e) => setAppDesc(e.target.value)}
                                        required
                                        className="bg-input"
                                    />
                                </div>
                                <Button type="submit" disabled={isLoadingForm || !appName} className="w-full">
                                    {isLoadingForm ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                    Register App
                                </Button>
                            </form>

                            <div className="mt-6">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Registered Apps</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {apps.length === 0 ? <p className="text-sm text-muted-foreground">No apps found.</p> : apps.map(app => (
                                        <div key={app.id} className="text-sm p-2 bg-secondary/50 rounded flex justify-between">
                                            <span className="font-medium text-foreground">{app.name}</span>
                                            <span className="text-muted-foreground text-xs">{app.url}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assign Credentials */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-accent" />
                                Assign User Access
                            </CardTitle>
                            <CardDescription>Grant a user explicit credentials to an app.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateCredential} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Application</Label>
                                    <select
                                        value={credAppId}
                                        onChange={(e) => setCredAppId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="" disabled>Choose an app...</option>
                                        {apps.map(app => (
                                            <option key={app.id} value={app.id}>{app.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Select User</Label>
                                    <select
                                        value={credUserId}
                                        onChange={(e) => setCredUserId(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="" disabled>Choose a user...</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 relative">
                                        <Label>Auth Username</Label>
                                        <Input
                                            placeholder="Auto-generated username"
                                            value={credUsername}
                                            onChange={(e) => setCredUsername(e.target.value)}
                                            required
                                            className="bg-input"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-2 relative">
                                        <Label>Auth Password</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text" // Use text so user can see the generated code easily during setup
                                                placeholder="Auto-generated password"
                                                value={credPassword}
                                                onChange={(e) => setCredPassword(e.target.value)}
                                                required
                                                className="bg-input font-mono"
                                                autoComplete="off"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={generateRandomCreds}
                                                title="Re-generate"
                                                className="shrink-0"
                                            >
                                                <Activity className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" disabled={isLoadingForm || !credAppId || !credUserId || !credUsername} variant="secondary" className="w-full">
                                    {isLoadingForm ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                                    Generate Credentials
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Define Login Window */}
                    <Card className="bg-card border-border md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-500" />
                                Define Allowed Login Time
                            </CardTitle>
                            <CardDescription>Restrict access to an application during specific hours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateLoginWindow} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>User</Label>
                                        <select
                                            value={windowUserId}
                                            onChange={(e) => setWindowUserId(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="" disabled>User...</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Application</Label>
                                        <select
                                            value={windowAppId}
                                            onChange={(e) => setWindowAppId(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="" disabled>App...</option>
                                            {apps.map(app => (
                                                <option key={app.id} value={app.id}>{app.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            value={windowStart}
                                            onChange={(e) => setWindowStart(e.target.value)}
                                            required
                                            className="bg-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            value={windowEnd}
                                            onChange={(e) => setWindowEnd(e.target.value)}
                                            required
                                            className="bg-input"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isLoadingForm || !windowUserId || !windowAppId} variant="outline" className="w-full mt-4 border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-500">
                                    {isLoadingForm ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                                    Set Login Window
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </DashboardLayout>
    );
}
