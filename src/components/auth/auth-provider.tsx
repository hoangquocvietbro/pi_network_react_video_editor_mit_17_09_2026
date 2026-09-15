"use client";

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/use-auth-store';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingScreen } from '../ui/loading-screen';

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthProvider({
  children,
  requireAuth = false,
  redirectTo = '/auth/login'
}: AuthProviderProps) {
  const {
    isAuthenticated,
    isLoading,
    checkAuth,
    _hasHydrated,
    _hasCheckedAuth
  } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  // Check authentication on mount (only once)
  useEffect(() => {
    if (_hasHydrated) {
      checkAuth();
    }
  }, [_hasHydrated, checkAuth]);

  // Handle redirects based on auth state - only after hydration AND auth check
  useEffect(() => {
    // Wait for both hydration and auth check to complete
    if (!_hasHydrated || !_hasCheckedAuth || isLoading) {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    if (requireAuth && !isAuthenticated) {
      // Protected route but user not authenticated
      hasRedirected.current = true;
      router.push(redirectTo);
    } else if (!requireAuth && isAuthenticated) {
      // Auth page but user already authenticated
      const isAuthPage = pathname?.startsWith('/auth/');
      if (isAuthPage) {
        hasRedirected.current = true;
        router.push('/projects');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router, pathname, _hasHydrated, _hasCheckedAuth]);

  // Reset redirect flag on pathname change
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  const isAuthPage = pathname?.startsWith('/auth/');

  // Show loading state while checking auth
  // Only stall rendering for protected routes or auth routes
  if ((requireAuth || isAuthPage) && (!_hasHydrated || isLoading || !_hasCheckedAuth)) {
    return <LoadingScreen message="Loading..." />;
  }

  // Don't render protected content if not authenticated
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
