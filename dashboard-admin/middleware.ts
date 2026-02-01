import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Refresh the session so server components see the latest auth state
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: ["/", "/((?!login|_next|_static|favicon.ico).*)"],
};
