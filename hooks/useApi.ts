import { useEffect, useState } from 'react';
import { getToken, getAuthHeader } from '@/lib/auth';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, any>;
  skip?: boolean;
}

export function useApi<T>(
  url: string,
  options: ApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (options.skip) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const fullUrl = `${apiUrl}${url}`;

        const response = await fetch(fullUrl, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(token),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          }
          const error = await response.json();
          throw new Error(error.detail || 'API request failed');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  return { data, error, isLoading };
}

export async function apiCall<T>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const fullUrl = `${apiUrl}${url}`;

  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(token),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    const error = await response.json();
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}
