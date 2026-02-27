'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Lock, Download, FileText, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

export default function FinanceApp() {
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
                        app_id: 'app_finance',
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
                body: JSON.stringify({ app_id: 'app_finance', username, password })
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
                    app_id: 'app_finance',
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
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 text-white shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto bg-green-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center border border-green-500/50">
                            <Activity className="w-10 h-10 text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Acme Finance Portal</CardTitle>
                        <CardDescription className="text-neutral-400">Restricted financial dashboard</CardDescription>
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
                                    placeholder="App Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 focus-visible:ring-green-500"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="App Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 focus-visible:ring-green-500"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                                {isLoading ? 'Authenticating...' : 'Secure Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-100 text-neutral-900 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <Activity className="w-8 h-8 text-green-600" />
                        <div>
                            <h1 className="text-2xl font-bold">Acme Finance Portal</h1>
                            <p className="text-sm text-neutral-500">Welcome, {user?.name}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setIsLoggedIn(false)} className="border-neutral-300">
                        Sign Out
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border-0">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-neutral-500" />
                                Standard Reports
                            </CardTitle>
                            <CardDescription>Daily financial summaries</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button onClick={() => handleAction('View Daily Summary', false)} variant="outline" className="w-full justify-start font-normal">
                                View Daily Summary (Non-sensitive)
                            </Button>
                            <Button onClick={() => handleAction('Download Vendor List', false)} variant="outline" className="w-full justify-start font-normal">
                                Download Vendor List (Non-sensitive)
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0 border-t-4 border-t-red-500 ring-1 ring-red-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                                <Lock className="w-5 h-5" />
                                Highly Sensitive Data
                            </CardTitle>
                            <CardDescription>Restricted access reports</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button onClick={() => handleAction('Download Q4 Earnings (Draft)', true, 'FILE: earnings_q4_draft.xlsx')} variant="destructive" className="w-full justify-start font-normal bg-red-50 hover:bg-red-100 text-red-700 border border-red-200">
                                <Download className="w-4 h-4 mr-2" />
                                Download Q4 Earnings (Draft)
                            </Button>
                            <Button onClick={() => handleAction('Export Executive Payroll', true, 'FILE: payroll_exec_final.csv')} variant="destructive" className="w-full justify-start font-normal bg-red-50 hover:bg-red-100 text-red-700 border border-red-200">
                                <Download className="w-4 h-4 mr-2" />
                                Export Executive Payroll
                            </Button>
                            <Button onClick={() => handleAction('View Unreleased M&A Data', true, 'VIEW: project_phoenix_merger.pdf')} variant="destructive" className="w-full justify-start font-normal bg-red-50 hover:bg-red-100 text-red-700 border border-red-200">
                                <FileText className="w-4 h-4 mr-2" />
                                View Unreleased M&A Data
                            </Button>
                        </CardContent>
                    </Card>

                    {/* REAL EXPORT SECTION */}
                    <Card className="md:col-span-2 shadow-sm border border-neutral-200">
                        <CardHeader className="border-b border-neutral-100 pb-4 bg-neutral-50/50">
                            <CardTitle className="text-lg flex items-center gap-2 text-neutral-800">
                                <Download className="w-5 h-5 text-neutral-600" />
                                Data Export Center
                            </CardTitle>
                            <CardDescription className="text-neutral-500">
                                Download available financial records and logs (CSV).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <Button
                                onClick={() => handleAction('Export Bulk Ledger', true, undefined, undefined, 'http://localhost:8080/api/downloads/finance/bulk_ledger_export.csv')}
                                variant="outline"
                                className="h-24 flex flex-col gap-1 items-center justify-center hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                            >
                                <FileText className="w-6 h-6 text-green-600" />
                                <span className="font-bold">Bulk Ledger Export</span>
                                <span className="text-[10px] text-neutral-400">CSV Document</span>
                            </Button>
                            <Button
                                onClick={() => handleAction('Download Tax Records', true, undefined, undefined, 'http://localhost:8080/api/downloads/finance/tax_records.csv')}
                                variant="outline"
                                className="h-24 flex flex-col gap-1 items-center justify-center hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                            >
                                <Activity className="w-6 h-6 text-green-600" />
                                <span className="font-bold">Full Tax Records</span>
                                <span className="text-[10px] text-neutral-400">CSV Document</span>
                            </Button>
                            <Button
                                onClick={() => handleAction('Export SWIFT Logs', true, undefined, undefined, 'http://localhost:8080/api/downloads/finance/swift_logs.csv')}
                                variant="outline"
                                className="h-24 flex flex-col gap-1 items-center justify-center hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                            >
                                <Lock className="w-6 h-6 text-red-500" />
                                <span className="font-bold">Swift Transfer Logs</span>
                                <span className="text-[10px] text-red-400">Restricted CSV</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* NEW: Sample Data Table */}
                    <Card className="md:col-span-2 shadow-sm border border-neutral-200">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Financial Transactions</CardTitle>
                            <CardDescription>Sample live feed from General Ledger</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">Entity</th>
                                            <th className="px-4 py-2">Amount</th>
                                            <th className="px-4 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        <tr>
                                            <td className="px-4 py-3">Feb 27, 2026</td>
                                            <td className="px-4 py-3">Amazon Web Services</td>
                                            <td className="px-4 py-3 font-semibold text-red-600">-$12,450.00</td>
                                            <td className="px-4 py-3 text-green-600">Cleared</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Feb 27, 2026</td>
                                            <td className="px-4 py-3">Client Payment #9921</td>
                                            <td className="px-4 py-3 font-semibold text-green-600">+$45,000.00</td>
                                            <td className="px-4 py-3 text-amber-600">Pending</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Feb 26, 2026</td>
                                            <td className="px-4 py-3">Office Lease (Q1)</td>
                                            <td className="px-4 py-3 font-semibold text-red-600">-$8,200.00</td>
                                            <td className="px-4 py-3 text-green-600">Cleared</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
