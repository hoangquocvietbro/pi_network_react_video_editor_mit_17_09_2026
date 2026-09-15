import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Disable middleware for now to avoid routing conflicts
  // Authentication will be handled by AuthProvider components
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Disable middleware matching
    '/((?!.*).*)',
  ],
};
