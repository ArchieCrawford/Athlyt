import { supabase } from "../../supabaseClient";

export const getBlockedUserIds = async (userId?: string): Promise<string[]> => {
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return [];
    }
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_uid")
    .eq("blocker_uid", resolvedUserId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.blocked_uid as string);
};

export const isUserBlocked = async (
  blockedUserId: string,
  currentUserId?: string,
): Promise<boolean> => {
  let resolvedUserId = currentUserId;
  if (!resolvedUserId) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return false;
    }
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_uid")
    .eq("blocker_uid", resolvedUserId)
    .eq("blocked_uid", blockedUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
};

export const blockUser = async (blockedUserId: string) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User is not authenticated");
  }

  const { error: insertError } = await supabase
    .from("blocks")
    .upsert({ blocker_uid: user.id, blocked_uid: blockedUserId });

  if (insertError) {
    throw insertError;
  }
};

export const unblockUser = async (blockedUserId: string) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User is not authenticated");
  }

  const { error: deleteError } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_uid", user.id)
    .eq("blocked_uid", blockedUserId);

  if (deleteError) {
    throw deleteError;
  }
};
