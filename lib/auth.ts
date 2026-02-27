import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  user_id: string;
  email: string;
  session_id: string;
  exp: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LoginResponse {
  access_token: string;
  role: string;
  session_id: string;
  mfa_required: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    role: data.role,
    session_id: data.session_id,
    mfa_required: data.mfa_required
  };
}

export async function register(
  email: string,
  password: string,
  name: string,
  role: string = 'user'
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    role: data.role,
    session_id: data.session_id,
    mfa_required: false
  };
}

export async function verifyMfa(sessionId: string, otp: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, otp }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'MFA verification failed');
  }

  return true;
}

export function storeAuth(token: string, role: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_role', role);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function removeAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getAuthHeader(token: string | null): Record<string, string> {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}
