"use client";
import { PUBLIC_ENV } from "../../lib/public-env";
import { useAuthStore } from '../../store/use-auth-store';
import { useProjectStore } from '../../store/use-project-store';

export function AuthDebug() {
  const { user, isAuthenticated, isLoading, error, sessionExpiry } = useAuthStore();
  const { currentProject, projectName, isDirty } = useProjectStore();

  if (PUBLIC_ENV.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>User: {user?.name || 'None'}</div>
        <div>Session Expiry: {sessionExpiry ? new Date(sessionExpiry).toLocaleString() : 'None'}</div>
        <div>Error: {error || 'None'}</div>
        <div className="border-t pt-1 mt-2">
          <div>Current Project: {currentProject?.name || 'None'}</div>
          <div>Project Name: {projectName}</div>
          <div>Dirty: {isDirty ? '⚠️' : '✅'}</div>
        </div>
      </div>
    </div>
  );
}
