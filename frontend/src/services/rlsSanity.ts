import { supabase } from "../../supabaseClient";
import {
  FOLLOWS_TABLE,
  POSTS_TABLE,
  PROFILES_TABLE,
  PROFILES_TABLE_FALLBACK,
} from "../constants/supabaseTables";

const isMissingTableError = (error: { code?: string; message?: string }, table: string) => {
  if (!error) {
    return false;
  }
  if (error.code === "42P01") {
    return true;
  }
  if (typeof error.message === "string") {
    return error.message.includes(table);
  }
  return false;
};

const logRlsWarning = (table: string, error: { message?: string; status?: number }) => {
  const status = error?.status ? ` (${error.status})` : "";
  console.warn(`[RLS] ${table} blocked${status}: ${error?.message ?? "Unknown error"}`);
};

export const runRlsSanityCheck = async () => {
  if (!__DEV__) {
    return;
  }

  const checkTable = async (table: string) => {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      if (error.status === 401 || error.status === 403) {
        logRlsWarning(table, error);
      }
      return false;
    }
    return true;
  };

  const profileOk = await checkTable(PROFILES_TABLE);
  if (!profileOk) {
    const fallbackError = await supabase
      .from(PROFILES_TABLE_FALLBACK)
      .select("*")
      .limit(1);
    if (
      fallbackError.error &&
      !isMissingTableError(fallbackError.error, PROFILES_TABLE_FALLBACK) &&
      (fallbackError.error.status === 401 || fallbackError.error.status === 403)
    ) {
      logRlsWarning(PROFILES_TABLE_FALLBACK, fallbackError.error);
    }
  }

  await checkTable(POSTS_TABLE);
  await checkTable(FOLLOWS_TABLE);
};
