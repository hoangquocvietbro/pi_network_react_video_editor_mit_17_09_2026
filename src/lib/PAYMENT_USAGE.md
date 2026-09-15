# Pi Network Official Integration — VEditor Developer Guide

## Overview

This project directly integrates the **Official Pi Network SDK v2.0** (`https://sdk.minepi.com/pi-sdk.js`) and **Pi Platform API v2** (`https://api.minepi.com/v2`).
All dependencies on experimental third-party wrappers (such as SDKLite) have been eliminated.

---

## 1. Authentication (Pi Login)

### Client Side
The Pi SDK is loaded via `<script src="https://sdk.minepi.com/pi-sdk.js"></script>` in `<head>`.
The client initializes `Pi.init({ version: "2.0" })` and signs in via `Pi.authenticate(["username"], onIncompletePaymentFound)`:

```typescript
// Await Pi.init without sandbox parameter (detected automatically)
await window.Pi.init({ version: "2.0" });

// Authenticate with ["username"] scope and keep only accessToken
const auth = await window.Pi.authenticate(["username"], onIncompletePaymentFound);
const accessToken = auth.accessToken;

// Send only accessToken to backend
await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ accessToken }),
});
```

### Server Side (`/api/auth/login`)
- Exchanges `accessToken` with Pi App Studio Backend:
  `POST https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login`
- App Studio validates the token against Pi Platform and returns verified `{ sessionToken, user: { uid, username } }`.
- Upserts the user into Neon Postgres (`users` table) using the trusted `uid` and `username`.
- Issues a secure Stateless JWT cookie `auth-token`.
- Note: Never accept `uid` / `username` from client, and never call `/v2/me` directly.

---

## 2. Pi Payments (User to App — U2A)

Payments follow the standard 3-phase flow with server-side approval and completion via Pi Platform API v2 (`https://api.minepi.com`):

### Supported Products
1. **Remove Ads Pass**:
   - Price: `5 Pi`
   - Memo: `"VEditor - Remove Ads Pass (5 Pi)"`
   - Metadata: `{ type: "remove_ads", product: "remove_ads", name: "Remove Ads Pass", price: 5 }`
   - Benefits: Completely removes interstitial ads during video exports.
2. **1 Month Remote Video Render Pass**:
   - Price: `10 Pi`
   - Memo: `"VEditor - 1 Month Remote Video Render (10 Pi)"`
   - Metadata: `{ type: "remote_render_monthly", product: "remote_render_monthly", name: "1 Month Remote Video Render Pass", duration_days: 30, price: 10 }`
   - Benefits: Unlocks remote SSR cloud video rendering for 30 days + no ads.

### Client-side Usage
```typescript
import { usePiPayment } from "@/lib/pi-payment";

const { buyRemoveAds, buyRemoteRenderMonthly, hasRemovedAds, hasRemoteRender } = usePiPayment();

// Purchase Remove Ads Pass (5 Pi)
await buyRemoveAds();

// Purchase 1 Month Remote Render Pass (10 Pi)
await buyRemoteRenderMonthly();
```

### Backend Payment Endpoints
- `POST /api/pi/payment/approve`:
  - Called during callback `onReadyForServerApproval(paymentId)`.
  - Sends approval request to `https://api.minepi.com/v2/payments/${paymentId}/approve` with header `Authorization: Key ${PI_NETWORK_API_KEY}`.
  - Updates transaction status in the `payments` table to `APPROVED`.
- `POST /api/pi/payment/complete`:
  - Called during callback `onReadyForServerCompletion(paymentId, txid)` and `onIncompletePaymentFound`.
  - Submits completion request to `https://api.minepi.com/v2/payments/${paymentId}/complete` with `{ txid }` and header `Authorization: Key ${PI_NETWORK_API_KEY}`.
  - Updates transaction status to `COMPLETED`.
  - Updates user entitlements in Neon Postgres (`remove_ads = true` or `remote_render_until = NOW() + INTERVAL '30 days'`).
- `POST /api/pi/payment/cancel`:
  - Called when the user cancels the payment flow (`onCancel`).
  - Records status as `CANCELLED` in database.

---

## 3. Pi Ads (Developer Ad Network)

### Check Support
```typescript
import { usePiAds } from "@/lib/pi-payment";

const { isAdNetworkSupported, showInterstitial, showRewarded } = usePiAds();

if (await isAdNetworkSupported()) {
  // Pi Browser supports the Developer Ad Network
}
```

### Interstitial Ads (Between video export or navigation)
```typescript
const adClosed = await showInterstitial();
if (adClosed) {
  // Continue normal flow (e.g. start video rendering)
}
```

### Rewarded Ads (Watch ad for free export / credits)
Rewarded ads are securely verified server-side with anti-replay protection:

```typescript
const result = await showRewarded();
if (result.success && result.rewardGranted) {
  console.log("Reward received! New credit balance:", result.newCredits);
}
```

### Backend Ad Verification (`POST /api/pi/ads/reward`)
- Client sends `{ adId }` returned from `Pi.Ads.showAd("rewarded")`.
- Backend verifies status via `GET https://api.minepi.com/v2/ads_network/status/${adId}` with `Authorization: Key ${SERVER_ENV.PI_API}`.
- Confirms `mediator_ack_status === "granted"`.
- Checks `ad_rewards` table to prevent replay attacks.
- Grants +1 credit to the authenticated user in PostgreSQL.
