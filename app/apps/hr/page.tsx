'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Lock, Download, FileText, Users, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

export default function HrApp() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            handleAction('enter_module', false, 'Module Entry');
            return () => {
                fetch('http://localhost:8080/api/app-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        app_id: 'app_hr',
                        action: 'exit_module',
                        details: 'Module Exit',
                        is_sensitive: false
                    })
                }).catch(console.error);
            };
        }
    }, [isLoggedIn]);

    const [token, setToken] = useState('');
    const [user, setUser] = useState<any>(null);
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:8080/api/app-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ app_id: 'app_hr', username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');

            setToken(data.access_token);
            setUser(data.user);
            setIsLoggedIn(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (actionName: string, sensitive: boolean, details?: string, metadata?: any, downloadUrl?: string) => {
        try {
            const res = await fetch('http://localhost:8080/api/app-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    app_id: 'app_hr',
                    action: actionName,
                    details: details || actionName,
                    metadata: metadata || {},
                    is_sensitive: sensitive
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Action failed');

            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
                toast({ title: 'Download Started', description: `${actionName}.` });
            } else {
                toast({ title: 'Success', description: `${actionName} completed.` });
            }
        } catch (err: any) {
            toast({ title: 'Security Block', description: err.message, variant: 'destructive' });
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-sky-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-sky-900 bg-sky-950 text-white shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto bg-sky-900/50 p-4 rounded-full w-20 h-20 flex items-center justify-center border border-sky-500/50">
                            <Users className="w-10 h-10 text-sky-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Global HR Portal</CardTitle>
                        <CardDescription className="text-sky-200/70">Employee portal access</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Employee ID (Username)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-sky-900 border-sky-800 text-white placeholder:text-sky-300/50 focus-visible:ring-sky-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="PIN code"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-sky-900 border-sky-800 text-white placeholder:text-sky-300/50 focus-visible:ring-sky-500"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold">
                                {isLoading ? 'Authenticating...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-sky-100 p-3 rounded-lg">
                            <Users className="w-8 h-8 text-sky-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Global HR Portal</h1>
                            <p className="text-sm text-slate-500">Employee Module — Authenticated as {user?.name}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
                        Log Out
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border border-slate-200">
                        <CardHeader className="bg-slate-100/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-sky-600" />
                                My Directory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-2 py-2">ID</th>
                                            <th className="px-2 py-2">Name</th>
                                            <th className="px-2 py-2">Department</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-2 text-sky-600 font-mono">HR-101</td>
                                            <td className="px-2 py-2">Sarah Jenkins</td>
                                            <td className="px-2 py-2">Operations</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-2 text-sky-600 font-mono">HR-102</td>
                                            <td className="px-2 py-2">Michael Chen</td>
                                            <td className="px-2 py-2">Engineering</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-2 py-2 text-sky-600 font-mono">HR-103</td>
                                            <td className="px-2 py-2">Emma Wilson</td>
                                            <td className="px-2 py-2">Marketing</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <Button onClick={() => handleAction('View Company Holidays', false)} variant="outline" className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-sky-600">
                                <FileText className="w-4 h-4 mr-2" />
                                View Company Holidays
                            </Button>
                            <Button onClick={() => handleAction('Check PTO Balance', false)} variant="outline" className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-sky-600">
                                <Activity className="w-4 h-4 mr-2" />
                                Check PTO Balance
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0 ring-1 ring-amber-200 bg-gradient-to-br from-white to-amber-50">
                        <CardHeader className="border-b border-amber-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                                <Lock className="w-5 h-5" />
                                Manager Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <Button onClick={() => handleAction('Export All Employee SSNs', true, 'FILE: global_ssn_export.xlsx', undefined, 'http://localhost:8080/api/downloads/hr/global_ssn_export.csv')} variant="secondary" className="w-full justify-start font-medium bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export All Employee SSNs
                            </Button>
                            <Button onClick={() => handleAction('Modify Executive Bonus Structure', true, 'MOD: exec_bonuses_v2')} variant="secondary" className="w-full justify-start font-medium bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Modify Executive Bonus Structure
                            </Button>
                            <Button onClick={() => handleAction('Download Board Member List', true, 'FILE: board_members_details.pdf', undefined, 'http://localhost:8080/api/downloads/hr/board_members_details.csv')} variant="secondary" className="w-full justify-start font-medium bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                <Download className="w-4 h-4 mr-2" />
                                Download Board Member List
                            </Button>
                        </CardContent>
                    </Card>

                    {/* REAL EXPORT SECTION */}
                    <Card className="md:col-span-2 shadow-sm border border-neutral-200">
                        <CardHeader className="border-b border-neutral-100 pb-4 bg-sky-50/50">
                            <CardTitle className="text-lg flex items-center gap-2 text-sky-800">
                                <Download className="w-5 h-5 text-sky-600" />
                                HR Forms & Data Export
                            </CardTitle>
                            <CardDescription className="text-sky-700/70">
                                Download authorized employee data and mass export files (CSV/PDF).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <Button
                                onClick={() => handleAction('Export Mass Employee PII', true, undefined, undefined, 'http://localhost:8080/api/downloads/hr/mass_pii_export.csv')}
                                variant="outline"
                                className="h-24 flex flex-col gap-1 items-center justify-center hover:bg-sky-50 border-sky-200 text-sky-900"
                            >
                                <Users className="w-6 h-6 text-sky-600" />
                                <span className="font-bold">Mass PII Export</span>
                                <span className="text-[10px] text-sky-600/70">CSV Document</span>
                            </Button>
                            <Button
                                onClick={() => handleAction('Download Payroll Database Dump', true, undefined, undefined, 'http://localhost:8080/api/downloads/hr/payroll_dump.csv')}
                                variant="outline"
                                className="h-24 flex flex-col gap-1 items-center justify-center hover:bg-sky-50 border-sky-200 text-sky-900"
                            >
                                <Lock className="w-6 h-6 text-sky-600" />
                                <span className="font-bold">Payroll Dump</span>
                                <span className="text-[10px] text-sky-600/70">Restricted CSV</span>
                            </Button>
                            <Button
                                onClick={() => handleAction('Download Offboarding Queue', true, undefined, undefined, 'http://localhost:8080/api/downloads/hr/offboarding.csv')}
                                variant="outline"
                                className="h-24 flex flex-col gap-1 items-center justify-center hover:bg-sky-50 border-sky-200 text-sky-900"
                            >
                                <FileText className="w-6 h-6 text-sky-600" />
                                <span className="font-bold">Offboarding Queue</span>
                                <span className="text-[10px] text-sky-600/70">CSV Document</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
