import { NextRequest, NextResponse } from 'next/server';
import { SERVER_ENV } from '@/lib/server-env';
import { executeNeonQuery, ensurePiTablesExist } from '@/lib/database';
import { getAuthCookie, verifyJWT, sanitizeUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensurePiTablesExist();
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, error: 'Missing paymentId or txid' },
        { status: 400 }
      );
    }

    const PI_NETWORK_API_KEY = process.env.PI_NETWORK_API_KEY || SERVER_ENV.PI_NETWORK_API_KEY || SERVER_ENV.PI_API;
    if (!PI_NETWORK_API_KEY) {
      console.error('PI_NETWORK_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: PI_NETWORK_API_KEY missing' },
        { status: 500 }
      );
    }

    // 1. Verify and complete the payment with Pi Network Platform API
    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_NETWORK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    const paymentData = await piResponse.json();

    if (!piResponse.ok) {
      console.error('Error completing payment with Pi API:', piResponse.status, paymentData);
      return NextResponse.json(
        {
          success: false,
          error: paymentData?.error || paymentData?.message || 'Payment completion failed on Pi Server'
        },
        { status: piResponse.status }
      );
    }

    console.log('Payment verified and completed by Pi Platform API:', paymentId, 'txid:', txid);

    // 2. Identify the user (from Pi API response user_uid or active session)
    const piUid = paymentData.user_uid;
    let targetUserId: string | null = null;

    if (piUid) {
      const userResult = await executeNeonQuery('SELECT id FROM users WHERE pi_uid = $1 LIMIT 1;', [piUid]);
      if (userResult.rows?.length > 0) {
        targetUserId = userResult.rows[0].id;
      }
    }

    if (!targetUserId) {
      try {
        const token = await getAuthCookie();
        if (token) {
          const payload = await verifyJWT(token);
          if (payload?.userId) {
            targetUserId = payload.userId;
          }
        }
      } catch (e) {
        console.warn('Session verification failed during payment completion:', e);
      }
    }

    // 3. Update payment status in database
    await executeNeonQuery(`
      INSERT INTO payments (id, user_id, user_uid, amount, memo, metadata, txid, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET status = 'COMPLETED', txid = $7, updated_at = NOW(), user_id = COALESCE(payments.user_id, $2);
    `, [
      paymentId,
      targetUserId,
      piUid || '',
      paymentData.amount || 0,
      paymentData.memo || '',
      JSON.stringify(paymentData.metadata || {}),
      txid,
    ]);

    // 4. Update user entitlement based on product type
    let updatedUser = null;
    const metadata = paymentData.metadata || {};
    const productType = metadata.type || metadata.product;
    const amount = Number(paymentData.amount);

    if (targetUserId) {
      if (productType === 'remote_render_monthly' || amount === 10) {
        // 10 Pi Package: 1 Month Remote Video Render (30 days) + Remove Ads
        const updateRes = await executeNeonQuery(`
          UPDATE users
          SET remote_render_until = NOW() + INTERVAL '30 days',
              remove_ads = TRUE,
              is_vip = TRUE,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *;
        `, [targetUserId]);
        updatedUser = updateRes.rows[0];
      } else if (productType === 'remove_ads' || amount === 5) {
        // 5 Pi Package: Remove Ads Pass
        const updateRes = await executeNeonQuery(`
          UPDATE users
          SET remove_ads = TRUE,
              is_vip = TRUE,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *;
        `, [targetUserId]);
        updatedUser = updateRes.rows[0];
      } else {
        // Fallback default VIP pass
        const updateRes = await executeNeonQuery(`
          UPDATE users
          SET is_vip = TRUE,
              remove_ads = TRUE,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *;
        `, [targetUserId]);
        updatedUser = updateRes.rows[0];
      }
    }

    return NextResponse.json({
      success: true,
      data: paymentData,
      user: updatedUser ? sanitizeUser(updatedUser) : null,
    });
  } catch (error: any) {
    console.error('Error in complete-payment route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Payment completion failed' },
      { status: 500 }
    );
  }
}
