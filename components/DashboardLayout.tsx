'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Lock, Menu, LogOut, Shield, BarChart3, Activity, Bell, Radio } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export default function DashboardLayout({ children, userRole = 'admin' }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    removeAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-primary">ZeroTrust</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <NavLink
            href="/dashboard"
            icon={<BarChart3 className="w-5 h-5" />}
            label="Dashboard"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/incidents"
            icon={<Shield className="w-5 h-5" />}
            label="Incidents"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/users"
            icon={<Activity className="w-5 h-5" />}
            label="Users"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/alerts"
            icon={<Bell className="w-5 h-5" />}
            label="Alerts"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/sessions"
            icon={<Radio className="w-5 h-5" />}
            label="Live Sessions"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/management"
            icon={<Lock className="w-5 h-5" />}
            label="Access Config"
            sidebarOpen={sidebarOpen}
          />
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-foreground">
            Admin Portal
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Zero Trust Platform</div>
          </div>
        </div>

        {/* Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  sidebarOpen: boolean;
}

function NavLink({ href, icon, label, sidebarOpen }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-foreground hover:bg-secondary ${!sidebarOpen && 'justify-center'
        }`}
    >
      {icon}
      {sidebarOpen && <span className="font-medium text-sm">{label}</span>}
    </Link>
  );
}
