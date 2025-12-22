import { Post } from "../../../types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const scorePost = (post: Post, seenIds: Set<string>) => {
  const createdAt = Date.parse(post.creation || "");
  const hoursSince = createdAt
    ? Math.max(0.1, (Date.now() - createdAt) / (1000 * 60 * 60))
    : 72;
  const recency = Math.exp(-hoursSince / 24);
  const engagement = Math.log1p(
    (post.likesCount || 0) + 2 * (post.commentsCount || 0),
  );
  const novelty = seenIds.has(post.id) ? 0 : 0.15;

  return clamp(recency * 2 + engagement * 0.35 + novelty, 0, 10);
};

export const rankPosts = (posts: Post[], seenIds: Set<string>) => {
  return [...posts].sort((a, b) => scorePost(b, seenIds) - scorePost(a, seenIds));
};
