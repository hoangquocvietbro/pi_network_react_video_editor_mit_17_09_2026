import { NextRequest, NextResponse } from 'next/server';
import { executeNeonQuery } from '../../../../lib/database'; // Import hàm Pure Fetch SQL
import { getAuthCookie, verifyJWT, clearAuthCookie } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Get token from cookie
    const token = await getAuthCookie();

    if (!token) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // 2. Verify JWT (Sử dụng await vì verifyJWT hiện tại là async)
    const payload = await verifyJWT(token);

    // 3. Stateless: Chỉ cần xóa Cookie ở phía Client, không cần xóa trong DB
    await clearAuthCookie();

    // Ngay cả khi JWT không hợp lệ (hết hạn), việc xóa Cookie vẫn nên thực hiện
    if (!payload) {
      return NextResponse.json(
        { message: 'Session already invalid, cookie cleared' },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
