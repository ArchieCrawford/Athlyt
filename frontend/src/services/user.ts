import { resolveStorageBucketForPath, supabase } from "../../supabaseClient";
import {
  FOLLOWS_TABLE,
  PROFILES_TABLE,
  PROFILES_TABLE_FALLBACK,
} from "../constants/supabaseTables";
import { saveMediaToStorage } from "./utils";
import { SearchUser, User } from "../../types";

type UserCreatedAtColumn = "created_at" | "createdAt";
type FollowColumns = {
  follower: "follower" | "follower_id";
  following: "following" | "user_id";
};

const PUBLIC_USER_FIELDS =
  "uid, displayName, username, avatar_path, photoURL, bio, followingCount, followersCount, likesCount";
const PUBLIC_USER_FIELDS_NO_USERNAME =
  "uid, displayName, avatar_path, photoURL, bio, followingCount, followersCount, likesCount";
const PUBLIC_USER_VIEW_FIELDS = "uid, displayName, username, photoURL, bio";

let profilesTable = PROFILES_TABLE;
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

const runUserOrderQuery = async <T>(
  builder: (column: UserCreatedAtColumn) => Promise<{ data: T | null; error: any }>,
): Promise<T> => {
  let column = userCreatedAtColumn;
  let result = await builder(column);

  if (result.error && isMissingTableError(result.error, profilesTable)) {
    profilesTable = PROFILES_TABLE_FALLBACK;
    result = await builder(column);
  }

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

const runProfileQuery = async <T>(
  builder: (table: string) => Promise<{ data: T | null; error: any }>,
): Promise<T> => {
  let result = await builder(profilesTable);

  if (result.error && isMissingTableError(result.error, profilesTable)) {
    profilesTable = PROFILES_TABLE_FALLBACK;
    result = await builder(profilesTable);
  }

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as T;
};

const normalizeUserRow = (item: any): User => {
  const uid = item?.uid ?? item?.id ?? "";
  return {
    uid,
    email: "",
    displayName: item?.displayName ?? null,
    photoURL: item?.photoURL ?? null,
    avatar_path: item?.avatar_path ?? null,
    bio: item?.bio ?? null,
    username: item?.username ?? null,
    pronoun: item?.pronoun ?? null,
    links: item?.links ?? null,
    college: item?.college ?? null,
    followingCount: Number(item?.followingCount ?? 0),
    followersCount: Number(item?.followersCount ?? 0),
    likesCount: Number(item?.likesCount ?? 0),
  };
};

const normalizeSearchUser = (item: any): SearchUser => {
  const base = normalizeUserRow(item);
  return { id: base.uid, ...base };
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

      const avatarPath = `profileImage/${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.jpg`;
      await saveMediaToStorage(image, avatarPath);

      await runProfileQuery((table) =>
        supabase
          .from(table)
          .update({ avatar_path: null, photoURL: avatarPath })
          .eq("uid", user.id),
      );

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

      const existingProfile = await runProfileQuery<{ photoURL?: string | null; avatar_path?: string | null }>(
        (table) =>
          supabase
            .from(table)
            .select("photoURL, avatar_path")
            .eq("uid", user.id)
            .single(),
      );

      await runProfileQuery((table) =>
        supabase
          .from(table)
          .update({ avatar_path: null, photoURL: null })
          .eq("uid", user.id),
      );

      await supabase.auth.updateUser({
        data: { avatar_path: null, photoURL: null },
      });

      const path = existingProfile?.photoURL ?? existingProfile?.avatar_path;
      if (path) {
        const bucket = resolveStorageBucketForPath(path);
        await supabase.storage.from(bucket).remove([path]);
      }

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

      await runProfileQuery((table) =>
        supabase.from(table).update(updatePayload).eq("uid", user.id),
      );

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

      let tableName = profilesTable;
      let result = await supabase
        .from(tableName)
        .select(PUBLIC_USER_FIELDS)
        .ilike("email", `${email}%`)
        .limit(15);

      if (
        result.error &&
        (isMissingTableError(result.error, tableName) ||
          isMissingColumnError(result.error, "email"))
      ) {
        profilesTable = PROFILES_TABLE_FALLBACK;
        tableName = profilesTable;
        result = await supabase
          .from(tableName)
          .select(PUBLIC_USER_FIELDS)
          .ilike("email", `${email}%`)
          .limit(15);
      }

      if (result.error) {
        throw result.error;
      }

      const users = (result.data || []).map((item) => normalizeSearchUser(item));
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

      const buildSearch = (
        table: string,
        includeUsername: boolean,
        fields: string,
      ) => {
        let request = supabase.from(table).select(fields);
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
          PUBLIC_USER_VIEW_FIELDS,
        );
        if (error) {
          throw error;
        }
        data = (viewData || []) as SearchUser[];
      } catch (error: any) {
        let tableName = profilesTable;
        let { data: tableData, error: tableError } = await buildSearch(
          tableName,
          true,
          PUBLIC_USER_FIELDS,
        );
        if (tableError) {
          if (isMissingTableError(tableError, tableName)) {
            profilesTable = PROFILES_TABLE_FALLBACK;
            tableName = profilesTable;
            const retry = await buildSearch(
              tableName,
              true,
              PUBLIC_USER_FIELDS,
            );
            tableData = retry.data;
            tableError = retry.error;
          }
          if (isMissingColumnError(tableError, "username")) {
            const { data: fallbackData, error: fallbackError } =
              await buildSearch(
                tableName,
                false,
                PUBLIC_USER_FIELDS_NO_USERNAME,
              );
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

      const users = (data || []).map((item: any) => normalizeSearchUser(item));
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
      .from(profilesTable)
      .select(PUBLIC_USER_FIELDS)
      .order(column, { ascending: false })
      .limit(limit);

    if (excludeList.length > 0) {
      query = query.not("uid", "in", `(${excludeList})`);
    }

    return query;
  });

  return (data || []).map((item: any) => normalizeSearchUser(item));
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
      .from(profilesTable)
      .select(PUBLIC_USER_FIELDS)
      .order(column, { ascending: false })
      .limit(limit);

    if (ids.length > 0) {
      const excludeList = ids.map((id) => `"${id}"`).join(",");
      request = request.not("uid", "in", `(${excludeList})`);
    }

    return request;
  });

  return (data || []).map((item: any) => normalizeSearchUser(item));
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
      .from(profilesTable)
      .select(PUBLIC_USER_FIELDS)
      .order(column, { ascending: false })
      .range(offset, offset + limit - 1);

    if (excludeIds.length > 0) {
      const excludeList = excludeIds.map((id) => `"${id}"`).join(",");
      request = request.not("uid", "in", `(${excludeList})`);
    }

    return request;
  });

  const users = (data || []).map((item: any) => normalizeSearchUser(item));
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
        .from(FOLLOWS_TABLE)
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
        .from(FOLLOWS_TABLE)
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
    const data = await runProfileQuery((table) =>
      supabase.from(table).select(PUBLIC_USER_FIELDS).eq("uid", id).single(),
    );

    return data ? normalizeUserRow(data) : null;
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
        .from(FOLLOWS_TABLE)
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
          .from(FOLLOWS_TABLE)
          .delete()
          .eq(cols.follower, currentUserUid)
          .eq(cols.following, otherUserId),
      );
      return true;
    } else {
      await runFollowQuery((cols) =>
        supabase
          .from(FOLLOWS_TABLE)
          .insert({ [cols.follower]: currentUserUid, [cols.following]: otherUserId }),
      );
      return true;
    }
  } catch (error) {
    console.error("Error changing follow state: ", error);
    return false;
  }
};
