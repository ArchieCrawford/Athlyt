import { supabase } from "../../supabaseClient";

export type ReportTargetType = "post" | "user";

export const createReport = async ({
  targetType,
  targetId,
  reason,
  details,
}: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User is not authenticated");
  }

  const payload = {
    reporter_uid: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details?.trim() || null,
  };

  const { error: insertError } = await supabase.from("reports").insert(payload);

  if (insertError) {
    throw insertError;
  }
};
