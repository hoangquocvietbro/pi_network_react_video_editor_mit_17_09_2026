'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { usePiPayment, PAYMENT_PRODUCTS } from '@/lib/pi-payment';
import { toast } from 'sonner';

export function VipPaymentButton() {
  const { buyRemoveAds, buyRemoteRenderMonthly, isReady, isAuthenticated, hasRemovedAds, hasRemoteRender } = usePiPayment();
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const handlePurchase = async (product: 'remove_ads' | 'remote_render') => {
    if (!isAuthenticated) {
      toast.error('Please sign in with your Pi Network account first');
      return;
    }

    setLoadingProduct(product);

    try {
      const result = product === 'remove_ads' ? await buyRemoveAds() : await buyRemoteRenderMonthly();
      if (result.success) {
        toast.success(
          product === 'remove_ads'
            ? 'Successfully activated Remove Ads Pass!'
            : 'Successfully activated 1 Month Remote Video Render Pass!'
        );
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Payment failed');
    } finally {
      setLoadingProduct(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Product 1: Remove Ads - 5 Pi */}
      {hasRemovedAds ? (
        <Button disabled variant="outline" className="w-full gap-2 text-primary border-primary/30 h-9 text-xs">
          <CheckCircle size={15} />
          Remove Ads Active
        </Button>
      ) : (
        <Button
          onClick={() => handlePurchase('remove_ads')}
          disabled={loadingProduct !== null || !isReady}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-10 rounded-lg text-xs gap-2"
        >
          {loadingProduct === 'remove_ads' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing 5 Pi Payment...
            </>
          ) : (
            <>
              <ShieldCheck size={16} className="text-primary" />
              Remove Ads — {PAYMENT_PRODUCTS.REMOVE_ADS.amount} Pi
            </>
          )}
        </Button>
      )}

      {/* Product 2: Remote Video Render 1 Month - 10 Pi */}
      {hasRemoteRender ? (
        <Button disabled variant="outline" className="w-full gap-2 text-primary border-primary/30 h-9 text-xs">
          <CheckCircle size={15} />
          Remote Video Render Active (1 Month)
        </Button>
      ) : (
        <Button
          onClick={() => handlePurchase('remote_render')}
          disabled={loadingProduct !== null || !isReady}
          className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/40 font-semibold h-10 rounded-lg text-xs gap-2"
        >
          {loadingProduct === 'remote_render' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing 10 Pi Payment...
            </>
          ) : (
            <>
              <Crown size={16} className="text-yellow-500" />
              Remote Render (1 Month) — {PAYMENT_PRODUCTS.REMOTE_RENDER_MONTHLY.amount} Pi
            </>
          )}
        </Button>
      )}
    </div>
  );
}
