import { supabase } from "../../supabaseClient";
import { saveMediaToStorage } from "./utils";
import { SearchUser, User } from "../../types";

export const saveUserProfileImage = (image: string) =>
  new Promise<void>(async (resolve, reject) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("User is not authenticated");
      }

      const downloadURL = await saveMediaToStorage(
        image,
        `profileImage/${user.id}`,
      );

      const { error: updateError } = await supabase
        .from("user")
        .update({ photoURL: downloadURL })
        .eq("uid", user.id);

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.updateUser({
        data: { photoURL: downloadURL },
      });

      resolve();
    } catch (error) {
      console.error("Failed to save user profile image: ", error);
      reject(error);
    }
  });

export const saveUserField = (field: string, value: string) =>
  new Promise<void>(async (resolve, reject) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("User is not authenticated");
      }

      const updatePayload: Record<string, string> = {};
      updatePayload[field] = value;

      const { error: updateError } = await supabase
        .from("user")
        .update(updatePayload)
        .eq("uid", user.id);

      if (updateError) {
        throw updateError;
      }

      resolve();
    } catch (error) {
      console.error("Failed to save user field: ", error);
      reject(error);
    }
  });

export const queryUsersByEmail = (email: string): Promise<SearchUser[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (email === "") {
        resolve([]);
        return;
      }

      const { data, error } = await supabase
        .from("user")
        .select("*")
        .ilike("email", `${email}%`)
        .limit(15);

      if (error) {
        throw error;
      }

      const users = (data || []).map((item) => ({ id: item.uid, ...item })) as SearchUser[];
      resolve(users);
    } catch (error) {
      console.error("Failed to query users: ", error);
      reject(error);
    }
  });
};

export const queryUsersByName = (query: string): Promise<SearchUser[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (query === "") {
        resolve([]);
        return;
      }

      const { data, error } = await supabase
        .from("user")
        .select("*")
        .or(`displayName.ilike.${query}%,email.ilike.${query}%`)
        .limit(15);

      if (error) {
        throw error;
      }

      const users = (data || []).map((item) => ({ id: item.uid, ...item })) as SearchUser[];
      resolve(users);
    } catch (error) {
      console.error("Failed to query users: ", error);
      reject(error);
    }
  });
};

export const getFollowingIds = async (): Promise<string[]> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return [];
    }

    const { data, error: followingError } = await supabase
      .from("following")
      .select("following")
      .eq("follower", user.id);

    if (followingError) {
      throw followingError;
    }

    return (data || []).map((row) => row.following as string);
  } catch (error) {
    console.error("Failed to load following list: ", error);
    return [];
  }
};

/**
 * fetches the doc corresponding to the id of a user.
 *
 * @param {String} id of the user we want to fetch
 * @returns {Promise<User>} user object if successful.
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("uid", id)
      .single();

    if (error) {
      throw error;
    }

    return (data as User) || null;
  } catch (error) {
    throw new Error(String(error));
  }
};

/**
 * Checks if a user is following another by seeing if a follow doc exists.
 *
 * @param {String} userId of the user we want to see if it's following another
 * @param {String} otherUserId the id of the user that we want to check if it's being followed by another.
 * @returns {Boolean} if true means the user is indeed following the other User
 */
export const getIsFollowing = async (userId: string, otherUserId: string) => {
  try {
    const { data, error } = await supabase
      .from("following")
      .select("follower")
      .eq("follower", userId)
      .eq("following", otherUserId);

    if (error) {
      throw error;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error("Error checking following status: ", error);
    return false;
  }
};

/**
 * Changes the follow state of two users depending on the current
 * follow state.
 *
 * @param {Object} props object containing the relevant info
 * @param {Boolean} isFollowing current follow state
 * @param {String} otherUserId the id of the user that we want to check if it's being followed by another.
 * @returns
 */
export const changeFollowState = async ({
  otherUserId,
  isFollowing,
}: {
  otherUserId: string;
  isFollowing: boolean;
}) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const currentUserUid = user?.id ?? null;

  if (!currentUserUid || error) {
    console.error("No current user");
    return false;
  }

  try {
    if (isFollowing) {
      const { error: deleteError } = await supabase
        .from("following")
        .delete()
        .eq("follower", currentUserUid)
        .eq("following", otherUserId);

      if (deleteError) throw deleteError;
      return true;
    } else {
      const { error: insertError } = await supabase
        .from("following")
        .insert({ follower: currentUserUid, following: otherUserId });

      if (insertError) throw insertError;
      return true;
    }
  } catch (error) {
    console.error("Error changing follow state: ", error);
    return false;
  }
};
