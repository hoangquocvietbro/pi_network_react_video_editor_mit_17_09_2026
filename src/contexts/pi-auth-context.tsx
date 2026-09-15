"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { PI_NETWORK_CONFIG } from "@/lib/system-config";
import type { User, PiPaymentData } from "@/lib/types";
import { useAuthStore } from "@/store/use-auth-store";
import { toast } from "sonner";

declare global {
  interface Window {
    Pi: any;
  }
}

interface PiAuthContextType {
  isReady: boolean;
  isAuthenticated: boolean;
  authMessage: string;
  hasError: boolean;
  user: User | null;
  login: () => Promise<any>;
  logout: () => Promise<void>;
  createPayment: (paymentData: PiPaymentData) => Promise<{ success: boolean; data?: any; error?: string }>;
  isAdNetworkSupported: () => Promise<boolean>;
  showInterstitialAd: () => Promise<boolean>;
  showRewardedAd: () => Promise<{ success: boolean; rewardGranted?: boolean; newCredits?: number; error?: string }>;
  reinitialize: () => Promise<void>;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

const waitForPiSDK = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof window.Pi !== "undefined") {
      resolve();
      return;
    }

    if (typeof window === "undefined") {
      resolve();
      return;
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      if (typeof window.Pi !== "undefined") {
        clearInterval(interval);
        resolve();
      } else if (elapsed >= 5000) {
        clearInterval(interval);
        // Fallback: If not loaded yet, verify script in head
        const existingScript = document.querySelector(`script[src="${PI_NETWORK_CONFIG.SDK_URL}"]`);
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = PI_NETWORK_CONFIG.SDK_URL;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.head.appendChild(script);
        } else {
          resolve();
        }
      }
    }, 50);
  });
};

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [authMessage, setAuthMessage] = useState("Initializing Pi Network...");
  const [hasError, setHasError] = useState(false);

  const authStore = useAuthStore();
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = authStore;

  // Handle incomplete payments found during authentication
  const handleIncompletePayment = useCallback(async (payment: any) => {
    console.warn("[Pi Payment] Incomplete payment found:", payment);
    try {
      const paymentId = payment.identifier;
      const txid = payment.transaction?._link || payment.transaction?.txid;

      if (paymentId && txid) {
        console.log("[Pi Payment] Automatically completing pending payment:", paymentId);
        const res = await fetch("/api/pi/payment/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, txid }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          authStore.setUser(data.user);
          toast.success("Recovered previous pending payment!");
        }
      } else if (paymentId && !payment.transaction) {
        // Not submitted to blockchain, cancel it
        await fetch("/api/pi/payment/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
      }
    } catch (err) {
      console.error("[Pi Payment] Error resolving incomplete payment:", err);
    }
  }, [authStore]);

  const initialize = useCallback(async () => {
    setHasError(false);
    try {
      setAuthMessage("Loading Pi SDK...");
      await waitForPiSDK();

      if (typeof window === "undefined" || typeof window.Pi === "undefined") {
        console.warn("[Pi SDK] window.Pi is not defined in this browser.");
        setIsReady(false);
        setAuthMessage("Pi Network SDK is not available.");
        return;
      }

      setAuthMessage("Initializing Pi Network SDK...");
      // STEP 1: Await Pi.init({ version: "2.0" }) fully before calling Pi.authenticate(...).
      // Do not pass "sandbox" - it is detected automatically now.
      await window.Pi.init({ version: "2.0" });

      setIsReady(true);
      setAuthMessage("Pi Network ready");

      // Auto-authenticate with Pi SDK on load if not already authenticated
      if (!authStore.isAuthenticated) {
        try {
          // STEP 1: Call Pi.authenticate(["username"], onIncompletePaymentFound) on load
          const auth = await window.Pi.authenticate(["username"], handleIncompletePayment);
          if (auth?.accessToken) {
            // STEP 1 & 2: Keep accessToken. Ignore uid and username beside it.
            const response = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken: auth.accessToken }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.user) {
                authStore.setUser(data.user);
                authStore.setSessionExpiry(new Date(data.session.expires_at));
              }
            }
          }
        } catch (autoAuthErr) {
          console.log("[Pi SDK] Auto-authenticate on load note:", autoAuthErr);
        }
      }
    } catch (err) {
      console.error("[Pi SDK] Initialization error:", err);
      setHasError(true);
      setAuthMessage(
        err instanceof Error ? err.message : "Failed to initialize Pi Network SDK."
      );
    }
  }, [handleIncompletePayment, authStore]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Login handler using official Pi SDK
  const login = useCallback(async () => {
    try {
      if (typeof window === "undefined" || typeof window.Pi === "undefined") {
        throw new Error("Pi Network SDK is not loaded yet. Please open in Pi Browser.");
      }

      setAuthMessage("Authenticating with Pi Network...");
      // STEP 1: Await Pi.init fully before calling Pi.authenticate
      await window.Pi.init({ version: "2.0" });

      // Call Pi.authenticate(["username"], onIncompletePaymentFound) on sign-in button press
      const auth = await window.Pi.authenticate(["username"], handleIncompletePayment);

      // Keep the accessToken. Ignore the uid and username beside it.
      if (!auth?.accessToken) {
        throw new Error("No accessToken returned from Pi authentication.");
      }

      // STEP 2 & 3: Send accessToken to server API route
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed on server");
      }

      authStore.setUser(data.user);
      authStore.setSessionExpiry(new Date(data.session.expires_at));
      return data;
    } catch (error: any) {
      console.error("[Pi Auth] Login failed:", error);
      throw error;
    }
  }, [handleIncompletePayment, authStore]);

  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  // Official Pi Payment Flow (U2A)
  const createPayment = useCallback(
    async (paymentData: PiPaymentData): Promise<{ success: boolean; data?: any; error?: string }> => {
      if (typeof window === "undefined" || typeof window.Pi === "undefined") {
        return { success: false, error: "Pi Network SDK not ready. Please open in Pi Browser." };
      }

      try {
        // Await Pi.init before any Pi.createPayment call
        await window.Pi.init({ version: "2.0" });

        // Extend auth scope with payments and handle incomplete payments
        const scopes = ["username", "payments"];
        console.log("[Pi Payment] Extending auth scope with 'payments' via Pi.authenticate...");
        await window.Pi.authenticate(scopes, handleIncompletePayment);
        console.log("[Pi Payment] 'payments' scope successfully acquired");
      } catch (authError: any) {
        console.error("[Pi Payment] Failed to acquire payments scope:", authError);
        return {
          success: false,
          error: authError?.message || "Payments permission was not approved in Pi Browser.",
        };
      }

      return new Promise((resolve) => {
        try {
          window.Pi.createPayment(
            paymentData,
            {
              onReadyForServerApproval: async (paymentId: string) => {
                console.log("[Pi Payment] Ready for approval, paymentId:", paymentId);
                try {
                  const res = await fetch("/api/pi/payment/approve", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId }),
                  });
                  const resData = await res.json();
                  if (!res.ok || !resData.success) {
                    throw new Error(resData.error || "Server approval failed");
                  }
                  console.log("[Pi Payment] Server approval succeeded");
                } catch (err: any) {
                  console.error("[Pi Payment] Approval error:", err);
                  toast.error(`Approval error: ${err.message}`);
                }
              },
              onReadyForServerCompletion: async (paymentId: string, txid: string) => {
                console.log("[Pi Payment] Ready for completion, paymentId:", paymentId, "txid:", txid);
                try {
                  const res = await fetch("/api/pi/payment/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId, txid }),
                  });
                  const resData = await res.json();
                  if (!res.ok || !resData.success) {
                    throw new Error(resData.error || "Server completion failed");
                  }
                  console.log("[Pi Payment] Server completion succeeded:", resData);

                  // Update authStore user state if updated user received
                  if (resData.user) {
                    authStore.setUser(resData.user);
                  }

                  resolve({ success: true, data: resData.data });
                } catch (err: any) {
                  console.error("[Pi Payment] Completion error:", err);
                  toast.error(`Completion error: ${err.message}`);
                  resolve({ success: false, error: err.message });
                }
              },
              onCancel: async (paymentId: string) => {
                console.log("[Pi Payment] Payment cancelled by user:", paymentId);
                try {
                  await fetch("/api/pi/payment/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId }),
                  });
                } catch (e) {
                  console.warn("[Pi Payment] Cancel notification error:", e);
                }
                resolve({ success: false, error: "Payment was cancelled" });
              },
              onError: (error: Error, payment?: any) => {
                console.error("[Pi Payment] Payment error:", error, payment);
                resolve({ success: false, error: error.message || "Payment error occurred" });
              },
            }
          );
        } catch (createErr: any) {
          console.error("[Pi Payment] createPayment exception:", createErr);
          resolve({ success: false, error: createErr?.message || "Failed to create payment" });
        }
      });
    },
    [authStore, handleIncompletePayment]
  );

  // Check if Ad Network is supported on user's Pi Browser
  const isAdNetworkSupported = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || typeof window.Pi === "undefined") {
      return false;
    }
    // If Pi.Ads object is present, ads are supported
    if (typeof window.Pi.Ads !== "undefined") {
      return true;
    }
    try {
      if (typeof window.Pi.nativeFeaturesList === "function") {
        const features = await window.Pi.nativeFeaturesList();
        return Array.isArray(features) && features.includes("ad_network");
      }
      return false;
    } catch (e) {
      console.warn("[Pi Ads] Could not check ad network features:", e);
      return false;
    }
  }, []);

  // Show Interstitial Ad (e.g. before video export)
  const showInterstitialAd = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || typeof window.Pi === "undefined" || !window.Pi.Ads) {
      console.log("[Pi Ads] window.Pi.Ads is not available in current environment");
      return false;
    }
    try {
      console.log("[Pi Ads] Requesting interstitial ad display...");
      // In Pi SDK, calling showAd directly triggers the ad flow
      const showRes = await window.Pi.Ads.showAd("interstitial");
      console.log("[Pi Ads] Interstitial ad result:", showRes);

      if (showRes?.result === "AD_CLOSED") {
        return true;
      }
      if (showRes?.result === "ADS_NOT_SUPPORTED") {
        console.warn("[Pi Ads] ADS_NOT_SUPPORTED on this Pi Browser build.");
        return false;
      }
      if (showRes?.result === "AD_NOT_AVAILABLE") {
        console.warn("[Pi Ads] AD_NOT_AVAILABLE, requesting next ad in background...");
        try {
          await window.Pi.Ads.requestAd("interstitial");
        } catch (e) {
          // ignore
        }
        return false;
      }
      return false;
    } catch (err) {
      console.warn("[Pi Ads] Direct showAd error, trying requestAd fallback:", err);
      try {
        const reqRes = await window.Pi.Ads.requestAd("interstitial");
        console.log("[Pi Ads] requestAd result:", reqRes);
        if (reqRes?.result === "AD_LOADED") {
          const retryRes = await window.Pi.Ads.showAd("interstitial");
          return retryRes?.result === "AD_CLOSED";
        }
      } catch (retryErr) {
        console.error("[Pi Ads] Retry ad request failed:", retryErr);
      }
      return false;
    }
  }, []);

  // Show Rewarded Ad (watch ad for extra export credit)
  const showRewardedAd = useCallback(async (): Promise<{
    success: boolean;
    rewardGranted?: boolean;
    newCredits?: number;
    error?: string;
  }> => {
    if (typeof window === "undefined" || typeof window.Pi === "undefined" || !window.Pi.Ads) {
      return { success: false, error: "Pi Ads module not available in this browser." };
    }
    try {
      // Ensure user is authenticated in Pi SDK first
      try {
        const scopes = ["username", "payments", "wallet_address"];
        await window.Pi.authenticate(scopes, handleIncompletePayment);
      } catch (e) {
        console.warn("[Pi Ads] Auth check before rewarded ad:", e);
      }

      console.log("[Pi Ads] Showing rewarded ad...");
      let showRes: any = null;
      try {
        showRes = await window.Pi.Ads.showAd("rewarded");
      } catch (initialErr) {
        console.log("[Pi Ads] showAd failed, requesting ad first:", initialErr);
        await window.Pi.Ads.requestAd("rewarded");
        showRes = await window.Pi.Ads.showAd("rewarded");
      }

      console.log("[Pi Ads] Rewarded ad result:", showRes);

      if (showRes?.result === "AD_REWARDED" && showRes.adId) {
        // Verify server-side with Pi Platform API
        const verifyRes = await fetch("/api/pi/ads/reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: showRes.adId }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          return {
            success: false,
            error: verifyData.error || "Failed to verify ad reward on server",
          };
        }

        if (verifyData.user) {
          authStore.setUser(verifyData.user);
        }

        return {
          success: true,
          rewardGranted: true,
          newCredits: verifyData.newCredits,
        };
      }

      if (showRes?.result === "ADS_NOT_SUPPORTED") {
        return { success: false, error: "Pi Ads not supported on this Pi Browser build. Please update Pi Browser." };
      }

      if (showRes?.result === "AD_NOT_AVAILABLE") {
        return { success: false, error: "No ads currently available. Please try again in a few minutes." };
      }

      return { success: false, error: "Ad was not completed. No reward was granted." };
    } catch (err: any) {
      console.error("[Pi Ads] Error showing rewarded ad:", err);
      return { success: false, error: err.message || "Error displaying rewarded ad" };
    }
  }, [authStore, handleIncompletePayment]);

  const value: PiAuthContextType = {
    isReady,
    isAuthenticated,
    authMessage,
    hasError,
    user,
    login,
    logout,
    createPayment,
    isAdNetworkSupported,
    showInterstitialAd,
    showRewardedAd,
    reinitialize: initialize,
  };

  return <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>;
}

export function usePiAuth() {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error("usePiAuth must be used within a PiAuthProvider");
  }
  return context;
}
