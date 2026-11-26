import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ApiClientError } from '@/services/api';
import type { ApiResponse } from '@/types';

export interface UseApiOptions<T> {
  /** Automatically execute on mount and when deps change (default: true). */
  immediate?: boolean;
  /** Optional initial data before the first fetch resolves. */
  initialData?: T | null;
  /** Dependency array that triggers refetch when changed (when immediate is true). */
  deps?: DependencyList;
  /** Optional callback invoked with unwrapped response data. */
  onSuccess?: (data: T) => void;
  /** Optional callback invoked on request failure. */
  onError?: (error: ApiClientError) => void;
}

export interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<T | null>;
  setData: Dispatch<SetStateAction<T | null>>;
  reset: () => void;
}

function isApiResponseEnvelope<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ApiResponse<T>).success === 'boolean' &&
    'data' in value
  );
}

/**
 * Generic data-fetching hook with loading/error management and stale-request protection.
 */
export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T> | T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    immediate = true,
    initialData = null,
    deps = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiClientError | null>(null);

  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  fetcherRef.current = fetcher;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async (): Promise<T | null> => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcherRef.current();
      const resolvedData = isApiResponseEnvelope<T>(response) ? response.data : response;

      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(resolvedData);
        setIsLoading(false);
        onSuccessRef.current?.(resolvedData);
      }

      return resolvedData;
    } catch (err) {
      const apiError =
        err instanceof ApiClientError
          ? err
          : new ApiClientError(
              err instanceof Error ? err.message : 'An unexpected error occurred'
            );

      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(apiError);
        setIsLoading(false);
        onErrorRef.current?.(apiError);
      }

      return null;
    }
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      void refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, refetch, ...deps]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
    reset,
  };
}

export default useApi;
