import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AUTH_UNAUTHORIZED_EVENT,
  authApi,
  setAuthToken,
} from '@/services/api';
import type {
  LoginCredentials,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from '@/types';

interface LoginFn {
  (credentials: LoginCredentials): Promise<User>;
  (email: string, password: string): Promise<User>;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: LoginFn;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authApi.getMe();
      setUser(response.data);
      return response.data;
    } catch {
      setAuthToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const response = await authApi.getMe();
        if (isMounted) {
          setUser(response.data);
        }
      } catch {
        if (isMounted) {
          setAuthToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login: LoginFn = useCallback(
    async (credentialsOrEmail: LoginCredentials | string, password?: string): Promise<User> => {
      const credentials: LoginCredentials =
        typeof credentialsOrEmail === 'string'
          ? { email: credentialsOrEmail, password: password || '' }
          : credentialsOrEmail;
      const response = await authApi.login(credentials);
      const authenticatedUser = response.data.user;
      setUser(authenticatedUser);
      return authenticatedUser;
    },
    []
  );

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const response = await authApi.register(payload);
    const registeredUser = response.data.user;
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload): Promise<User> => {
    const response = await authApi.updateProfile(payload);
    setUser(response.data);
    return response.data;
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    return checkAuth();
  }, [checkAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, updateProfile, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
