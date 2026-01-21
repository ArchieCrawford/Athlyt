export const keys = {
  user: (user: string | null) => ["user", user],
  userFollowing: (userId: string, otherUserId: string) => [
    "following",
    userId + otherUserId,
  ],
  followingIds: (userId: string) => ["following-ids", userId],
  friendIds: (userId: string) => ["friend-ids", userId],
  userSearch: (query: string, excludeKey = "") => [
    "user-search",
    query,
    excludeKey,
  ],
  newUsers: (userId: string) => ["new-users", userId],
  newPosts: (userId: string, excludeFollowing: boolean) => [
    "new-posts",
    userId,
    excludeFollowing ? "exclude-following" : "all",
  ],
  allUsers: (userId: string) => ["all-users", userId],
  chats: (userId: string) => ["chats", userId],
  messages: (chatId: string) => ["messages", chatId],
  apiKeys: (userId: string) => ["api-keys", userId],
  scheduledPosts: (userId: string) => ["scheduled-posts", userId],
};
