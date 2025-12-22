import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabaseClient";

type EventProps = Record<string, any> | undefined;

let sessionId: string | null = null;
const SESSION_KEY = "telemetry_session_id";

function generateId() {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export async function startSession() {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
    const next = generateId();
    sessionId = next;
    await AsyncStorage.setItem(SESSION_KEY, next);
    return next;
  } catch (error) {
    console.log("startSession error", error);
    sessionId = generateId();
    return sessionId;
  }
}

export async function endSession() {
  try {
    sessionId = null;
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.log("endSession error", error);
  }
}

export async function logEvent(event: string, props?: EventProps) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sid = sessionId ?? (await startSession());
    await supabase.from("app_events").insert({
      event,
      user_id: user?.id ?? null,
      session_id: sid,
      props: props ?? null,
    });
  } catch (error) {
    console.log("logEvent error", error);
  }
}

export async function logAuthEvent(event: string, payload: { email?: string; error?: string }) {
  try {
    await supabase.from("auth_events").insert({
      event,
      email: payload.email ?? null,
      error: payload.error ?? null,
    });
  } catch (error) {
    console.log("logAuthEvent error", error);
  }
}
