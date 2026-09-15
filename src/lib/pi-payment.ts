"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";
import type { PiPaymentData } from "@/lib/types";

export const PAYMENT_PRODUCTS = {
  REMOVE_ADS: {
    id: "remove_ads",
    name: "Remove Ads Pass",
    amount: 5,
    memo: "VEditor - Remove Ads Pass (5 Pi)",
    metadata: {
      type: "remove_ads",
      product: "remove_ads",
      name: "Remove Ads Pass",
      price: 5,
    },
  },
  REMOTE_RENDER_MONTHLY: {
    id: "remote_render_monthly",
    name: "1 Month Remote Video Render Pass",
    amount: 10,
    memo: "VEditor - 1 Month Remote Video Render (10 Pi)",
    metadata: {
      type: "remote_render_monthly",
      product: "remote_render_monthly",
      name: "1 Month Remote Video Render Pass",
      duration_days: 30,
      price: 10,
    },
  },
} as const;

export function usePiPayment() {
  const { createPayment, isReady, isAuthenticated, user } = usePiAuth();

  const makePayment = async (data: PiPaymentData) => {
    if (!isReady) {
      throw new Error("Pi Network SDK is not ready yet.");
    }
    return createPayment(data);
  };

  // 1. Gói Xóa quảng cáo 5 Pi
  const buyRemoveAds = async () => {
    return createPayment({
      amount: PAYMENT_PRODUCTS.REMOVE_ADS.amount,
      memo: PAYMENT_PRODUCTS.REMOVE_ADS.memo,
      metadata: PAYMENT_PRODUCTS.REMOVE_ADS.metadata,
    });
  };

  // 2. Gói 10 Pi cho xuất video remote 1 tháng
  const buyRemoteRenderMonthly = async () => {
    return createPayment({
      amount: PAYMENT_PRODUCTS.REMOTE_RENDER_MONTHLY.amount,
      memo: PAYMENT_PRODUCTS.REMOTE_RENDER_MONTHLY.memo,
      metadata: PAYMENT_PRODUCTS.REMOTE_RENDER_MONTHLY.metadata,
    });
  };

  // Backward compatibility alias for legacy calls
  const buyVipPass = async (_priceInPi?: number) => {
    return buyRemoveAds();
  };

  const hasRemovedAds = Boolean(user?.remove_ads || user?.is_vip);
  const hasRemoteRender = Boolean(
    user?.remote_render_until && new Date(user.remote_render_until) > new Date()
  );

  return {
    makePayment,
    buyRemoveAds,
    buyRemoteRenderMonthly,
    buyVipPass,
    isReady,
    isAuthenticated,
    isVip: Boolean(user?.is_vip),
    hasRemovedAds,
    hasRemoteRender,
    remoteRenderUntil: user?.remote_render_until || null,
    credits: user?.credits ?? 0,
  };
}

export function usePiAds() {
  const { isAdNetworkSupported, showInterstitialAd, showRewardedAd } = usePiAuth();

  return {
    isAdNetworkSupported,
    showInterstitial: showInterstitialAd,
    showRewarded: showRewardedAd,
  };
}

// Backward compatibility alias
export const usePurchase = usePiPayment;
export const useAds = usePiAds;
