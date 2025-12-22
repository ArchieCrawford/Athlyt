import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  const headerList = headers();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
      headers: {
        get(name: string) {
          return headerList.get(name) ?? undefined;
        },
      },
    },
  );
};

export const serviceClient = () => {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
  );
};
