'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, storeAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MFA State
  const [showMfa, setShowMfa] = useState(false);
  const [mfaOtp, setMfaOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [authData, setAuthData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(email, password);

      // Only allow admin login
      if (data.role !== 'admin') {
        throw new Error(`This account is registered as a ${data.role}. Only administrators can log in.`);
      }

      if (data.mfa_required) {
        setShowMfa(true);
        setSessionId(data.session_id);
        setAuthData(data);
        return;
      }

      storeAuth(data.access_token, data.role);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { verifyMfa } = await import('@/lib/auth');
      await verifyMfa(sessionId, mfaOtp);

      // Success, proceed to dashboard
      storeAuth(authData.access_token, authData.role);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Administrative Access</p>
        </div>

        {/* Login Card */}
        <Card className="border-border bg-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-foreground">Admin Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Authorized personnel only. Access is monitored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showMfa ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMfaVerify} className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 text-center">
                  <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Multi-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A verification code has been sent to your administrator device.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 text-center">
                  <Label htmlFor="otp" className="text-foreground text-center block mb-2">
                    Enter 6-digit Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaOtp}
                    onChange={(e) => setMfaOtp(e.target.value)}
                    disabled={isLoading}
                    className="bg-input border-border text-foreground text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || mfaOtp.length !== 6}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowMfa(false)}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to login
                </button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Demo Credentials</p>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p>Admin: admin@zerotrust.io / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
