export { default } from "@supabase/auth-helpers-nextjs/edge-middleware";

export const config = {
  matcher: ["/", "/((?!login|_next|_static|favicon.ico).*)"],
};
