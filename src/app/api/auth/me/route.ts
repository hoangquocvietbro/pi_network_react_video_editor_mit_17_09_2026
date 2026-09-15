import { NextRequest, NextResponse } from 'next/server';
import { executeNeonQuery, ensurePiTablesExist } from '../../../../lib/database'; // Import hàm Pure Fetch SQL
import { getAuthCookie, verifyJWT, sanitizeUser, getSessionExpiryDate } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    await ensurePiTablesExist();
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
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // 3. Stateless: Không cần kiểm tra bảng sessions nữa, lấy thẳng user data
    const userQuery = `
      SELECT * FROM users 
      WHERE id = $1 
      LIMIT 1;
    `;
    const userResult = await executeNeonQuery(userQuery, [payload.userId]);
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Return sanitized user data
    const sanitizedUser = sanitizeUser(user);

    return NextResponse.json({
      user: sanitizedUser,
      session: {
        expires_at: getSessionExpiryDate(), // Trả về ngày hết hạn dự kiến
      },
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
