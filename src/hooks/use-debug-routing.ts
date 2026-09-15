"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/use-auth-store';
import { useProjectStore } from '../store/use-project-store';
import { PUBLIC_ENV } from '../lib/public-env';

export function useDebugRouting() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { currentProject } = useProjectStore();

  useEffect(() => {
    if (PUBLIC_ENV.NODE_ENV === 'development') {
      console.log('🔍 Routing Debug:', {
        pathname,
        isAuthenticated,
        isLoading,
        user: user?.name,
        currentProject: currentProject?.name,
        timestamp: new Date().toISOString()
      });
    }
  }, [pathname, isAuthenticated, isLoading, user, currentProject]);

  return {
    pathname,
    isAuthenticated,
    isLoading,
    user,
    currentProject
  };
}
