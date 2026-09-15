import { NextRequest, NextResponse } from 'next/server';
import { SERVER_ENV } from '@/lib/server-env';
import { executeNeonQuery, ensurePiTablesExist } from '@/lib/database';
import { getAuthCookie, verifyJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensurePiTablesExist();
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId' }, { status: 400 });
    }

    const PI_NETWORK_API_KEY = process.env.PI_NETWORK_API_KEY || SERVER_ENV.PI_NETWORK_API_KEY || SERVER_ENV.PI_API;
    if (!PI_NETWORK_API_KEY) {
      console.error('PI_NETWORK_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'PI_NETWORK_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    // Get current user if authenticated
    let userId: string | null = null;
    let userUid: string | null = null;
    try {
      const token = await getAuthCookie();
      if (token) {
        const payload = await verifyJWT(token);
        if (payload?.userId) {
          userId = payload.userId;
          const uRes = await executeNeonQuery('SELECT pi_uid FROM users WHERE id = $1 LIMIT 1', [userId]);
          if (uRes.rows?.[0]) {
            userUid = uRes.rows[0].pi_uid;
          }
        }
      }
    } catch (e) {
      console.warn('Could not identify user for payment approval:', e);
    }

    // Optional pre-check: verify payment details with Pi Platform API
    try {
      const detailsRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
        headers: {
          'Authorization': `Key ${PI_NETWORK_API_KEY}`,
        },
      });
      if (detailsRes.ok) {
        const paymentDetails = await detailsRes.json();
        console.log('[Pi Payment Approval Pre-check]', {
          paymentId,
          amount: paymentDetails.amount,
          memo: paymentDetails.memo,
          metadata: paymentDetails.metadata,
        });

        // Validate consistent product definition:
        // Product 1: Remove Ads (5 Pi, type: 'remove_ads')
        // Product 2: Remote Render 1 Month (10 Pi, type: 'remote_render_monthly')
        const amount = Number(paymentDetails.amount);
        const type = paymentDetails.metadata?.type;
        const isValidProduct = (type === 'remove_ads' && amount === 5) ||
                               (type === 'remote_render_monthly' && amount === 10) ||
                               (amount === 5 || amount === 10);

        if (!isValidProduct) {
          console.warn('[Pi Payment Approval] Unknown or mismatched product:', paymentDetails);
        }
      }
    } catch (checkErr) {
      console.warn('[Pi Payment Approval Pre-check failed, continuing to approve]', checkErr);
    }

    // Call Pi Network Platform API to approve payment
    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_NETWORK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await piResponse.json();

    if (!piResponse.ok) {
      console.error('Error approving payment from Pi API:', piResponse.status, data);
      return NextResponse.json(
        { success: false, error: data?.error || data?.message || 'Payment approval failed' },
        { status: piResponse.status }
      );
    }

    console.log('Payment approved successfully by Pi Platform:', paymentId);

    // Record or update payment in DB
    try {
      const amount = data.amount || 0;
      const memo = data.memo || '';
      const metadata = JSON.stringify(data.metadata || {});
      const user_uid = data.user_uid || userUid || '';

      await executeNeonQuery(`
        INSERT INTO payments (id, user_id, user_uid, amount, memo, metadata, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE 
        SET status = 'APPROVED', updated_at = NOW(), user_uid = EXCLUDED.user_uid;
      `, [paymentId, userId, user_uid, amount, memo, metadata]);
    } catch (dbErr) {
      console.error('Failed to log payment approval to database:', dbErr);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Exception in approve-payment route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
