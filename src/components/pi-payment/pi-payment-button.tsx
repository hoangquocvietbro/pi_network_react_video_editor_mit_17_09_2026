"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePiPayment } from "@/lib/pi-payment";
import { toast } from "sonner";

interface PiPaymentButtonProps {
  amount?: number;
  memo?: string;
  metadata?: Record<string, any>;
  buttonText?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PiPaymentButton({
  amount = 1.0,
  memo = "VEditor VIP Pass - Lifetime Ad-free & Cloud Render",
  metadata = { type: "vip_pass" },
  buttonText,
  className = "",
  onSuccess,
  onError,
}: PiPaymentButtonProps) {
  const { makePayment, isReady, isAuthenticated, isVip } = usePiPayment();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in with Pi Network to make a purchase.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("[Pi Payment] Starting payment:", { amount, memo, metadata });
      const result = await makePayment({
        amount,
        memo,
        metadata,
      });

      if (result.success) {
        toast.success(`Purchase successful! Enjoy your VIP benefits.`);
        onSuccess?.();
      } else {
        throw new Error(result.error || "Payment failed");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Purchase failed. Please try again.";
      console.error("[Pi Payment] Purchase error:", error);
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  if (isVip && metadata.type === "vip_pass") {
    return (
      <Button disabled variant="outline" className={className}>
        VIP Active
      </Button>
    );
  }

  const defaultLabel = buttonText || `Get VIP (${amount} Pi)`;

  return (
    <Button
      onClick={handlePurchase}
      disabled={isLoading || !isReady}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing Payment...
        </>
      ) : (
        defaultLabel
      )}
    </Button>
  );
}
