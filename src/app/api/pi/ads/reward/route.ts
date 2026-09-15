import { NextRequest, NextResponse } from 'next/server';
import { SERVER_ENV } from '@/lib/server-env';
import { executeNeonQuery, ensurePiTablesExist } from '@/lib/database';
import { getAuthCookie, verifyJWT, sanitizeUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensurePiTablesExist();
    const { adId } = await request.json();

    if (!adId) {
      return NextResponse.json({ success: false, error: 'Missing adId' }, { status: 400 });
    }

    // Authenticate user
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const userResult = await executeNeonQuery('SELECT * FROM users WHERE id = $1 LIMIT 1;', [payload.userId]);
    const user = userResult.rows?.[0];
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 1. Anti-replay check: Verify adId hasn't already been claimed
    const existingRewardResult = await executeNeonQuery('SELECT * FROM ad_rewards WHERE ad_id = $1 LIMIT 1;', [adId]);
    if (existingRewardResult.rows?.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This ad reward has already been claimed' },
        { status: 400 }
      );
    }

    const PI_SERVER_API_KEY = SERVER_ENV.PI_API;
    if (!PI_SERVER_API_KEY) {
      console.error('PI_SERVER_API_KEY is not configured');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // 2. Verify with Pi Platform API
    // GET https://api.minepi.com/v2/ads_network/status/:adId
    const piResponse = await fetch(`https://api.minepi.com/v2/ads_network/status/${adId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${PI_SERVER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const adStatus = await piResponse.json();

    if (!piResponse.ok) {
      console.error('Pi API ads verification failed:', piResponse.status, adStatus);
      return NextResponse.json(
        { success: false, error: adStatus?.error || 'Failed to verify ad with Pi Platform' },
        { status: piResponse.status }
      );
    }

    // Check if mediator_ack_status is "granted"
    if (adStatus.mediator_ack_status !== 'granted') {
      console.warn('Ad status mediator_ack_status is not granted:', adStatus.mediator_ack_status);
      return NextResponse.json(
        {
          success: false,
          error: `Ad reward not granted. Status: ${adStatus.mediator_ack_status || 'unknown'}`
        },
        { status: 400 }
      );
    }

    // 3. Mark adId as claimed to prevent replay attack
    await executeNeonQuery(`
      INSERT INTO ad_rewards (ad_id, user_uid, reward_type, reward_amount, granted_at)
      VALUES ($1, $2, 'export_credit', 1, NOW());
    `, [adId, user.pi_uid || '']);

    // 4. Grant reward: Increment user credits by 1
    const updateResult = await executeNeonQuery(`
      UPDATE users
      SET credits = COALESCE(credits, 0) + 1, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [user.id]);

    const updatedUser = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      rewardGranted: true,
      newCredits: updatedUser.credits,
      user: sanitizeUser(updatedUser),
    });
  } catch (error: any) {
    console.error('Error verifying rewarded ad:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error verifying ad' },
      { status: 500 }
    );
  }
}
