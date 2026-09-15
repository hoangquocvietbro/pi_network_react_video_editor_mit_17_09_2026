"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { LockIcon, SparklesIcon, TvIcon, CrownIcon, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { usePiAds, usePiPayment } from "@/lib/pi-payment";
import { toast } from "sonner";

interface ExportLoginPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingExports?: number;
  onRewardGranted?: () => void;
}

export function ExportLoginPrompt({
  open,
  onOpenChange,
  remainingExports = 0,
  onRewardGranted,
}: ExportLoginPromptProps) {
  const router = useRouter();
  const { isAuthenticated, login, isLoading: isAuthLoading } = useAuthStore();
  const { showRewarded, isAdNetworkSupported } = usePiAds();
  const { buyRemoveAds, buyRemoteRenderMonthly } = usePiPayment();

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<string | null>(null);

  const handlePiLogin = async () => {
    try {
      await login();
      toast.success("Logged in with Pi Network successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Login failed. Redirecting to login page...");
      onOpenChange(false);
      router.push("/auth/login");
    }
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    try {
      const result = await showRewarded();
      if (result.success && result.rewardGranted) {
        toast.success("Ad reward granted! +1 export credit added.");
        onRewardGranted?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Ad was not completed. No reward granted.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not show ad. Try again later.");
    } finally {
      setIsWatchingAd(false);
    }
  };

  const handleBuyRemoveAds = async () => {
    setBuyingProduct("remove_ads");
    try {
      const result = await buyRemoveAds();
      if (result.success) {
        toast.success("Successfully activated Remove Ads Pass (5 Pi)!");
        onOpenChange(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (e: any) {
      toast.error(e?.message || "Purchase failed.");
    } finally {
      setBuyingProduct(null);
    }
  };

  const handleBuyRemoteRender = async () => {
    setBuyingProduct("remote_render");
    try {
      const result = await buyRemoteRenderMonthly();
      if (result.success) {
        toast.success("Successfully activated 1 Month Remote Render Pass (10 Pi)!");
        onOpenChange(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (e: any) {
      toast.error(e?.message || "Purchase failed.");
    } finally {
      setBuyingProduct(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LockIcon className="h-5 w-5 text-primary" />
            {isAuthenticated ? "Export Limit Reached" : "Sign In to Continue Exporting"}
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "You need additional export credits or an upgraded pass to render this video."
              : remainingExports === 0
              ? "You've used all 3 free trial exports. Sign in with Pi Network to continue."
              : "Cloud rendering requires a Pi Network account. Sign in with 1-click."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Status Box */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free Exports Left:</span>
              <span className="font-semibold text-primary">{remainingExports}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pi Network Status:</span>
              <span className="font-semibold">
                {isAuthenticated ? "Signed In" : "Guest (Not signed in)"}
              </span>
            </div>
          </div>

          {/* Action Options */}
          <div className="flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                {/* Watch Ad for free export */}
                <Button
                  onClick={handleWatchAd}
                  disabled={isWatchingAd || buyingProduct !== null}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isWatchingAd ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Ad...
                    </>
                  ) : (
                    <>
                      <TvIcon className="h-4 w-4" />
                      Watch 1 Ad for +1 Free Export
                    </>
                  )}
                </Button>

                {/* Remove Ads Pass - 5 Pi */}
                <Button
                  onClick={handleBuyRemoveAds}
                  disabled={isWatchingAd || buyingProduct !== null}
                  variant="outline"
                  className="w-full flex items-center justify-between border-primary/40 text-primary hover:bg-primary/10 text-xs h-9"
                >
                  <span className="flex items-center gap-1.5">
                    <SparklesIcon className="h-3.5 w-3.5 text-primary" />
                    Remove Ads Permanently
                  </span>
                  {buyingProduct === "remove_ads" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="font-bold">5 Pi</span>
                  )}
                </Button>

                {/* Remote Render 1 Month - 10 Pi */}
                <Button
                  onClick={handleBuyRemoteRender}
                  disabled={isWatchingAd || buyingProduct !== null}
                  variant="outline"
                  className="w-full flex items-center justify-between border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10 text-xs h-9"
                >
                  <span className="flex items-center gap-1.5">
                    <CrownIcon className="h-3.5 w-3.5 text-yellow-500" />
                    Remote Video Render (1 Month)
                  </span>
                  {buyingProduct === "remote_render" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="font-bold">10 Pi</span>
                  )}
                </Button>
              </>
            ) : (
              /* Anonymous user needs Pi Sign-in */
              <Button
                onClick={handlePiLogin}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to Pi Network...
                  </>
                ) : (
                  "Sign In with Pi Network"
                )}
              </Button>
            )}
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            Fast, secure, and authenticated on the Pi Network blockchain.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
