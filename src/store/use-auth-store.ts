import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../lib/types';
import { toast } from 'sonner'
import { PUBLIC_ENV } from '../lib/public-env';

declare global {
  interface Window {
    Pi: any;
  }
}

interface AuthState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Session state
  sessionExpiry: Date | null;

  // Hydration tracking
  _hasHydrated: boolean;
  _hasCheckedAuth: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionExpiry: (expiry: Date | null) => void;
  setHasHydrated: (state: boolean) => void;

  // Auth operations
  login: () => Promise<void>;
  loginBypass: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Utility
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start as true to prevent flash
      error: null,
      sessionExpiry: null,
      _hasHydrated: false,
      _hasCheckedAuth: false,

      // Basic setters
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setSessionExpiry: (sessionExpiry) => set({ sessionExpiry }),

      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

      // Auth operations
      login: async () => {
        try {
          set({ isLoading: true, error: null });

          if (typeof window === 'undefined' || typeof window.Pi === 'undefined') {
            throw new Error('Pi Network SDK is not fully loaded yet. Please open in Pi Browser.');
          }

          // STEP 1: Await Pi.init({ version: "2.0" }) fully before calling Pi.authenticate(...)
          // Do not pass "sandbox" - it is detected automatically now.
          await window.Pi.init({ version: '2.0' });

          const onIncompletePaymentFound = async (payment: any) => {
            console.warn('[Pi Store] Incomplete payment found during login:', payment);
            try {
              const paymentId = payment?.identifier;
              const txid = payment?.transaction?._link || payment?.transaction?.txid;
              if (paymentId && txid) {
                const res = await fetch('/api/pi/payment/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid }),
                });
                const compData = await res.json();
                if (compData.success && compData.user) {
                  set({ user: compData.user });
                }
              }
            } catch (err) {
              console.error('[Pi Store] Error resolving incomplete payment:', err);
            }
          };

          // STEP 1: Call Pi.authenticate(["username"], onIncompletePaymentFound)
          const auth = await window.Pi.authenticate(['username'], onIncompletePaymentFound);

          // Keep the accessToken. Ignore the uid and username beside it.
          if (!auth?.accessToken) {
            throw new Error('No accessToken returned by Pi Network authentication');
          }

          // STEP 2 & 3: Call server-side API route with accessToken
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: auth.accessToken }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed on server');
          }

          set({
            user: data.user,
            isAuthenticated: true,
            sessionExpiry: new Date(data.session.expires_at),
            isLoading: false,
            error: null,
            _hasCheckedAuth: true
          });

          return data;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          await fetch('/api/auth/logout', {
            method: 'POST',
          });

          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            isLoading: false,
            error: null,
            _hasCheckedAuth: true
          });

        } catch (error) {
          console.error('Logout error:', error);
          // Even if logout fails on server, clear local state
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            isLoading: false,
            error: null,
            _hasCheckedAuth: true
          });
        }
      },

      checkAuth: async () => {
        const { sessionExpiry, _hasCheckedAuth, _hasHydrated } = get();

        // Skip if already checked this session and session not expired
        if (_hasCheckedAuth && sessionExpiry) {
          const expiry = new Date(sessionExpiry);
          if (expiry > new Date()) {
            set({ isLoading: false });
            return; // Session still valid, skip API call
          }
        }

        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/me');
          const data = await response.json();

          if (!response.ok) {
            // Session is invalid or expired
            set({
              user: null,
              isAuthenticated: false,
              sessionExpiry: null,
              isLoading: false,
              error: null,
              _hasCheckedAuth: true
            });
            return;
          }

          set({
            user: data.user,
            isAuthenticated: true,
            sessionExpiry: new Date(data.session.expires_at),
            isLoading: false,
            error: null,
            _hasCheckedAuth: true
          });

        } catch (error) {
          console.error('Auth check error:', error);
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            isLoading: false,
            error: null,
            _hasCheckedAuth: true
          });
        }
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          sessionExpiry: null,
          isLoading: false,
          error: null,
          _hasCheckedAuth: false
        });
      },

      loginBypass: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBypass: true }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Bypass login failed');
          }

          set({
            user: data.user,
            isAuthenticated: true,
            sessionExpiry: new Date(data.session.expires_at),
            isLoading: false,
            error: null,
            _hasCheckedAuth: true
          });

          return data;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Bypass login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when hydration is complete
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
