import { resolveStorageBucketForPath, supabase } from "../../supabaseClient";
import { saveMediaToStorage } from "./utils";
import { SearchUser, User } from "../../types";

type UserCreatedAtColumn = "created_at" | "createdAt";
type FollowColumns = {
  follower: "follower" | "follower_id";
  following: "following" | "user_id";
};

let userCreatedAtColumn: UserCreatedAtColumn = "created_at";
let followColumns: FollowColumns = { follower: "follower", following: "following" };

const isMissingColumnError = (error: { code?: string; message?: string }, column: string) => {
  if (!error) {
    return false;
  }
  if (error.code === "42703") {
    return true;
  }
  if (typeof error.message === "string") {
    return error.message.includes(column);
  }
  return false;
};

const runUserOrderQuery = async <T>(
  builder: (column: UserCreatedAtColumn) => Promise<{ data: T | null; error: any }>,
): Promise<T> => {
  let column = userCreatedAtColumn;
  let result = await builder(column);

  if (result.error && isMissingColumnError(result.error, column)) {
    column = column === "created_at" ? "createdAt" : "created_at";
    userCreatedAtColumn = column;
    result = await builder(column);
  }

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as T;
};

const runFollowQuery = async <T>(
  builder: (columns: FollowColumns) => Promise<{ data: T | null; error: any }>,
): Promise<{ data: T; columns: FollowColumns }> => {
  let result = await builder(followColumns);
  if (
    result.error &&
    (isMissingColumnError(result.error, followColumns.follower) ||
      isMissingColumnError(result.error, followColumns.following))
  ) {
    followColumns =
      followColumns.follower === "follower"
        ? { follower: "follower_id", following: "user_id" }
        : { follower: "follower", following: "following" };
    result = await builder(followColumns);
  }

  if (result.error) {
    throw result.error;
  }

  return { data: (result.data ?? []) as T, columns: followColumns };
};

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

      const avatarPath = `profileImage/${user.id}`;
      await saveMediaToStorage(image, avatarPath);

      const { error: updateError } = await supabase
        .from("user")
        .update({ avatar_path: null, photoURL: avatarPath })
        .eq("uid", user.id);

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.updateUser({
        data: { avatar_path: null, photoURL: avatarPath },
      });

      resolve();
    } catch (error) {
      console.error("Failed to save user profile image: ", error);
      reject(error);
    }
  });

export const removeUserProfileImage = () =>
  new Promise<void>(async (resolve, reject) => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("User is not authenticated");
      }

      const { error: updateError } = await supabase
        .from("user")
        .update({ avatar_path: null, photoURL: null })
        .eq("uid", user.id);

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.updateUser({
        data: { avatar_path: null, photoURL: null },
      });

      const path = `profileImage/${user.id}`;
      const bucket = resolveStorageBucketForPath(path);
      await supabase.storage.from(bucket).remove([path]);

      resolve();
    } catch (error) {
      console.error("Failed to remove user profile image: ", error);
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

export const queryUsersByName = (
  query: string,
  excludeIds: string[] = [],
): Promise<SearchUser[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const normalized = query.trim();
      if (normalized === "") {
        resolve([]);
        return;
      }

      const like = `%${normalized}%`;
      const excludeList = excludeIds.map((id) => `"${id}"`).join(",");

      const buildSearch = (table: string, includeUsername: boolean) => {
        let request = supabase.from(table).select("*");
        if (includeUsername) {
          request = request.or(
            `displayName.ilike.${like},username.ilike.${like}`,
          );
        } else {
          request = request.ilike("displayName", like);
        }
        if (excludeIds.length > 0) {
          request = request.not("uid", "in", `(${excludeList})`);
        }
        return request.limit(15);
      };

      let data: SearchUser[] | null = null;

      try {
        const { data: viewData, error } = await buildSearch(
          "user_search",
          true,
        );
        if (error) {
          throw error;
        }
        data = (viewData || []) as SearchUser[];
      } catch (error: any) {
        const { data: tableData, error: tableError } = await buildSearch(
          "user",
          true,
        );
        if (tableError) {
          if (isMissingColumnError(tableError, "username")) {
            const { data: fallbackData, error: fallbackError } =
              await buildSearch("user", false);
            if (fallbackError) {
              throw fallbackError;
            }
            data = (fallbackData || []) as SearchUser[];
          } else {
            throw tableError;
          }
        } else {
          data = (tableData || []) as SearchUser[];
        }
      }

      const users = (data || []).map((item: any) => ({
        id: item.uid,
        ...item,
        email: item.email ?? "",
      })) as SearchUser[];
      resolve(users);
    } catch (error) {
      console.error("Failed to query users: ", error);
      reject(error);
    }
  });
};

export const getSuggestedUsers = async (
  currentUserId: string,
  excludeIds: string[] = [],
  limit = 20,
): Promise<SearchUser[]> => {
  const ids = Array.from(new Set([currentUserId, ...excludeIds]));
  const excludeList = ids.map((id) => `"${id}"`).join(",");

  const data = await runUserOrderQuery((column) => {
    let query = supabase
      .from("user")
      .select("uid, email, displayName, username, avatar_path, photoURL, bio")
      .order(column, { ascending: false })
      .limit(limit);

    if (excludeList.length > 0) {
      query = query.not("uid", "in", `(${excludeList})`);
    }

    return query;
  });

  return (data || []).map((item: any) => ({ id: item.uid, ...item })) as SearchUser[];
};

export const getNewUsers = async (
  currentUserId?: string,
  limit = 12,
  excludeIds: string[] = [],
): Promise<SearchUser[]> => {
  const ids = Array.from(
    new Set([...(currentUserId ? [currentUserId] : []), ...excludeIds]),
  );
  const data = await runUserOrderQuery((column) => {
    let request = supabase
      .from("user")
      .select("uid, email, displayName, username, avatar_path, photoURL, bio")
      .order(column, { ascending: false })
      .limit(limit);

    if (ids.length > 0) {
      const excludeList = ids.map((id) => `"${id}"`).join(",");
      request = request.not("uid", "in", `(${excludeList})`);
    }

    return request;
  });

  return (data || []).map((item: any) => ({ id: item.uid, ...item })) as SearchUser[];
};

export const getUsersPage = async ({
  limit = 20,
  offset = 0,
  excludeIds = [],
}: {
  limit?: number;
  offset?: number;
  excludeIds?: string[];
}): Promise<{ users: SearchUser[]; nextOffset: number | null }> => {
  const data = await runUserOrderQuery((column) => {
    let request = supabase
      .from("user")
      .select("uid, email, displayName, username, avatar_path, photoURL, bio")
      .order(column, { ascending: false })
      .range(offset, offset + limit - 1);

    if (excludeIds.length > 0) {
      const excludeList = excludeIds.map((id) => `"${id}"`).join(",");
      request = request.not("uid", "in", `(${excludeList})`);
    }

    return request;
  });

  const users = (data || []).map((item: any) => ({ id: item.uid, ...item })) as SearchUser[];
  const nextOffset = users.length < limit ? null : offset + limit;

  return { users, nextOffset };
};

export const getFollowingIds = async (userId?: string): Promise<string[]> => {
  try {
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

    const { data, columns } = await runFollowQuery((cols) =>
      supabase
        .from("following")
        .select(cols.following)
        .eq(cols.follower, resolvedUserId),
    );

    return (data || []).map((row: any) => row[columns.following] as string);
  } catch (error) {
    console.error("Failed to load following list: ", error);
    return [];
  }
};

export const getFollowerIds = async (userId?: string): Promise<string[]> => {
  try {
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

    const { data, columns } = await runFollowQuery((cols) =>
      supabase
        .from("following")
        .select(cols.follower)
        .eq(cols.following, resolvedUserId),
    );

    return (data || []).map((row: any) => row[columns.follower] as string);
  } catch (error) {
    console.error("Failed to load follower list: ", error);
    return [];
  }
};

export const getFriendIds = async (userId?: string): Promise<string[]> => {
  try {
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

    const [followingIds, followerIds] = await Promise.all([
      getFollowingIds(resolvedUserId),
      getFollowerIds(resolvedUserId),
    ]);

    const followersSet = new Set(followerIds);
    return followingIds.filter((id) => followersSet.has(id));
  } catch (error) {
    console.error("Failed to load friend list: ", error);
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
    const { data } = await runFollowQuery((cols) =>
      supabase
        .from("following")
        .select(cols.follower)
        .eq(cols.follower, userId)
        .eq(cols.following, otherUserId),
    );

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
      await runFollowQuery((cols) =>
        supabase
          .from("following")
          .delete()
          .eq(cols.follower, currentUserUid)
          .eq(cols.following, otherUserId),
      );
      return true;
    } else {
      await runFollowQuery((cols) =>
        supabase
          .from("following")
          .insert({ [cols.follower]: currentUserUid, [cols.following]: otherUserId }),
      );
      return true;
    }
  } catch (error) {
    console.error("Error changing follow state: ", error);
    return false;
  }
};
