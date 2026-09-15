// File: app/api/test-db/route.ts
import { ensurePiTablesExist, executeNeonQuery } from '@/lib/database';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await ensurePiTablesExist();

        const usersColumns = await executeNeonQuery(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        const paymentsCheck = await executeNeonQuery(`
            SELECT COUNT(*) FROM payments;
        `);

        const adRewardsCheck = await executeNeonQuery(`
            SELECT COUNT(*) FROM ad_rewards;
        `);

        return NextResponse.json({
            success: true,
            message: "🎉 Database initialized and verified successfully!",
            usersColumns: usersColumns.rows,
            paymentsCount: paymentsCheck.rows[0],
            adRewardsCount: adRewardsCheck.rows[0],
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            message: "THẤT BẠI: Có lỗi xảy ra!",
            error_detail: error.message || String(error)
        }, { status: 500 });
    }
}
