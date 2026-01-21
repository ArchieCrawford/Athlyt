export interface Post {
  id: string;
  creator: string;
  media: string[];
  media_path?: string | null;
  thumb_path?: string | null;
  media_type?: "video" | "image";
  poster_url?: string | null;
  mux_playback_id?: string | null;
  description: string;
  sport?: string | null;
  team?: string | null;
  is_public?: boolean;
  is_deleted?: boolean;
  likesCount: number;
  commentsCount: number;
  bookmarksCount?: number;
  sharesCount?: number;
  creation: string;
}

export interface Comment {
  id: string;
  creator: string;
  comment: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL?: string;
  avatar_path?: string | null;
  bio?: string | null;
  username?: string | null;
  pronoun?: string | null;
  links?: string | null;
  college?: string | null;
  followingCount: number;
  followersCount: number;
  likesCount: number;
}

export interface SearchUser extends User {
  id: string;
}

export interface Chat {
  id: string;
  members: string[];
  lastMessage: string;
  lastUpdate?: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  creator: string;
  message: string;
}

export type ScheduledPostStatus =
  | "scheduled"
  | "running"
  | "posted"
  | "failed"
  | "canceled";

export interface ScheduledPostPayload {
  description?: string;
  media?: string[];
  media_type?: "image" | "video";
  mux_playback_id?: string | null;
  poster_url?: string | null;
}

export interface ScheduledPost {
  id: string;
  owner: string;
  run_at: string;
  payload: ScheduledPostPayload;
  status: ScheduledPostStatus;
  posted_post_id?: string | null;
  last_error?: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  owner?: string;
  label?: string | null;
  last_used_at?: string | null;
  created_at: string;
  revoked_at?: string | null;
}
