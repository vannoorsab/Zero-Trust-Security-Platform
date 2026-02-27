'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
      router.push('/dashboard');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">Z</div>
            <span className="text-xl font-bold tracking-tight">Zero Trust Platform</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login?role=admin"
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              Admin Login
            </Link>
            <Link
              href="/register?role=admin"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors text-sm font-medium shadow-sm shadow-primary/20"
            >
              System Setup
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Next-Gen Security Architecture
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight text-balance">
            Never Trust, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Always Verify.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            A comprehensive, AI-driven security framework that continuously evaluates contextual risk, detects behavioral anomalies in real-time, and dynamically blocks unauthorized access.
          </p>
          <Link
            href="/login?role=admin"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/25 text-lg"
          >
            Enter Dashboard
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 w-5 h-5"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t border-border px-6 py-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold mb-4">Z</div>
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Zero Trust Security Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
