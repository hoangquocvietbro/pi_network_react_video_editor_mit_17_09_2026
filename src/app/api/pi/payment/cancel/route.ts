import { NextRequest, NextResponse } from 'next/server';
import { SERVER_ENV } from '@/lib/server-env';
import { executeNeonQuery, ensurePiTablesExist } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    await ensurePiTablesExist();
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Missing paymentId' }, { status: 400 });
    }

    const PI_SERVER_API_KEY = SERVER_ENV.PI_API;
    if (!PI_SERVER_API_KEY) {
      console.error('PI_SERVER_API_KEY is not set');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // Call Pi API to cancel payment
    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_SERVER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await piResponse.json();

    // Update payment record in database if it exists
    try {
      await executeNeonQuery(`
        UPDATE payments
        SET status = 'CANCELLED', updated_at = NOW()
        WHERE id = $1;
      `, [paymentId]);
    } catch (dbErr) {
      console.error('Error updating cancelled payment in DB:', dbErr);
    }

    if (!piResponse.ok) {
      console.warn('Pi API returned non-OK status on cancel:', piResponse.status, data);
      return NextResponse.json({ success: false, error: data?.error || 'Failed to cancel payment' }, { status: piResponse.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in cancel-payment route:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Cancel payment failed' }, { status: 500 });
  }
}
