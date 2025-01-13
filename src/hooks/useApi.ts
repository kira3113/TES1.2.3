import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface ApiError {
  message: string;
  status?: number;
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { logout } = useAuth();

  const handleError = useCallback((error: any) => {
    const apiError: ApiError = {
      message: error.message || 'An unexpected error occurred'
    };

    if (error.status === 401) {
      logout();
      toast.error('Session expired. Please log in again.');
    } else if (error.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else {
      toast.error(apiError.message);
    }

    setError(apiError);
  }, [logout]);

  const execute = useCallback(async <R>(
    apiCall: () => Promise<R>,
    successMessage?: string
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result as unknown as T);
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (err: any) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    data,
    loading,
    error,
    execute
  };
} 