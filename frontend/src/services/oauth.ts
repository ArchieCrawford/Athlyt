import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../../supabaseClient";

WebBrowser.maybeCompleteAuthSession();

const buildRedirectUrl = () =>
  AuthSession.makeRedirectUri({ scheme: "tayp", path: "auth/callback" });

const extractCode = (
  result: AuthSession.AuthSessionResult,
): string | null => {
  if (result.type !== "success") {
    return null;
  }
  if ("params" in result && result.params?.code) {
    return result.params.code as string;
  }
  if (result.url) {
    try {
      const parsed = new URL(result.url);
      return parsed.searchParams.get("code");
    } catch {
      return null;
    }
  }
  return null;
};

export const signInWithProvider = async (provider: "google" | "apple") => {
  const redirectTo = buildRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }
  if (!data?.url) {
    throw new Error("No OAuth URL returned from Supabase");
  }

  const result = await AuthSession.startAsync({
    authUrl: data.url,
    returnUrl: redirectTo,
  });

  if (result.type !== "success") {
    const message =
      result.type === "dismiss" || result.type === "cancel"
        ? "Sign in canceled."
        : "OAuth flow failed.";
    throw new Error(message);
  }

  const code = extractCode(result);
  if (!code) {
    throw new Error("No code returned from OAuth redirect");
  }

  const exchange = await supabase.auth.exchangeCodeForSession(code);
  if (exchange.error) {
    throw exchange.error;
  }

  return exchange.data.session;
};
