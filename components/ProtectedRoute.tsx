'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isTokenValid } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token || !isTokenValid(token)) {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}
