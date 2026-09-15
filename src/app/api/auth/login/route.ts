import { NextRequest, NextResponse } from 'next/server';
import { executeNeonQuery, ensurePiTablesExist } from '../../../../lib/database'; // Import hàm gọi HTTP DB thuần
import {
  generateSessionToken,
  getSessionExpiryDate,
  generateJWT,
  setAuthCookie,
  sanitizeUser,
} from '../../../../lib/auth';
import { nanoid } from 'nanoid';
import type { PiLoginRequest } from '../../../../lib/types';
import { PI_NETWORK_CONFIG } from '../../../../lib/system-config';

export async function POST(request: NextRequest) {
  try {
    await ensurePiTablesExist();
    const body: PiLoginRequest = await request.json();
    const { accessToken, isBypass } = body;

    let finalUser: { uid: string; username: string };

    // 1. Chế độ Bypass (Chỉ cho phép ở Development để test cục bộ khi không có Pi Browser)
    if (isBypass) {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Bypass login is strictly disabled in production' },
          { status: 403 }
        );
      }
      console.log('--- DEBUG MODE: Bypassing Pi Network authentication ---');
      finalUser = {
        uid: 'test-user-id-001',
        username: 'test_dev_user',
      };
    } else {
      // 2. Validate accessToken
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Missing accessToken. Pi Network authentication requires an accessToken.' },
          { status: 400 }
        );
      }

      // 3. STEP 2: Exchange accessToken with App Studio Backend
      // App Studio checks the token against Pi Platform before answering,
      // so the uid and username it returns are the only identity your app may trust.
      try {
        const appStudioRes = await fetch(PI_NETWORK_CONFIG.APP_STUDIO_AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });

        if (!appStudioRes.ok) {
          const errorText = await appStudioRes.text();
          console.error('App Studio Auth Error:', appStudioRes.status, errorText);
          return NextResponse.json(
            { error: 'Failed to authenticate with App Studio' },
            { status: 401 }
          );
        }

        const appStudioData: {
          sessionToken?: string;
          user?: {
            uid: string;
            username: string;
          };
        } = await appStudioRes.json();

        if (!appStudioData.user || !appStudioData.user.uid || !appStudioData.user.username) {
          console.error('Invalid response format from App Studio:', appStudioData);
          return NextResponse.json(
            { error: 'Invalid user payload received from App Studio' },
            { status: 401 }
          );
        }

        finalUser = {
          uid: appStudioData.user.uid,
          username: appStudioData.user.username,
        };
      } catch (networkError) {
        console.error('Network error reaching App Studio:', networkError);
        return NextResponse.json(
          { error: 'Could not connect to App Studio auth service' },
          { status: 502 }
        );
      }
    }

    // 4. Truy vấn SQL: Tìm user theo pi_uid được xác thực từ App Studio
    const findUserQuery = `
      SELECT * FROM users 
      WHERE pi_uid = $1 
      LIMIT 1;
    `;
    const existingUsersResult = await executeNeonQuery(findUserQuery, [finalUser.uid]);
    let user = existingUsersResult.rows[0];

    if (!user) {
      // 5A. SQL Insert: Tạo user mới nếu chưa có, mặc định 3 lượt credits và is_vip false
      const insertUserQuery = `
        INSERT INTO users (id, name, pi_uid, username, credits, is_vip, created_at, updated_at, last_login)
        VALUES ($1, $2, $3, $4, 3, false, NOW(), NOW(), NOW())
        RETURNING *;
      `;
      const insertedUsersResult = await executeNeonQuery(insertUserQuery, [
        nanoid(),
        finalUser.username,
        finalUser.uid,
        finalUser.username,
      ]);
      user = insertedUsersResult.rows[0];
    } else {
      // 5B. SQL Update: Cập nhật thời gian đăng nhập lần cuối và cập nhật username mới nhất
      const updateUserQuery = `
        UPDATE users 
        SET last_login = NOW(), updated_at = NOW(), username = $2
        WHERE id = $1 
        RETURNING *;
      `;
      const updatedUsersResult = await executeNeonQuery(updateUserQuery, [user.id, finalUser.username]);
      user = updatedUsersResult.rows[0];
    }

    if (!user) {
      throw new Error('Database error: Failed to return user data after insert/update');
    }

    // 6. Chuẩn bị session (Stateless JWT)
    const sessionId = nanoid();
    const expiresAt = getSessionExpiryDate();

    // 7. Tạo JWT & Cài đặt Cookie
    const jwtToken = await generateJWT({ userId: user.id, sessionId });
    await setAuthCookie(jwtToken);

    // 8. Dọn dẹp dữ liệu User trả về cho Frontend
    const sanitizedUser = sanitizeUser(user);

    return NextResponse.json({
      user: sanitizedUser,
      session: {
        token: jwtToken,
        expires_at: expiresAt,
      },
    });

  } catch (error: any) {
    console.error('Login Route Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        debug_message: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
