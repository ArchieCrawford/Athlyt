export interface Post {
  id: string;
  creator: string;
  media: string[];
  media_type?: "video" | "image";
  poster_url?: string | null;
  mux_playback_id?: string | null;
  description: string;
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
