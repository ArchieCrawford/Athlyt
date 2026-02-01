import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../lib/supabaseServer";
import { createServiceClient } from "../lib/supabaseService";
import {
  FOLLOWS_TABLE,
  POST_COMMENTS_TABLE,
  POST_LIKES_TABLE,
  POSTS_TABLE,
  PROFILES_TABLE,
  PROFILES_TABLE_FALLBACK,
} from "../constants/supabaseTables";

type DailyCount = { date: string; count: number };
type Metrics = {
  totalUsers: number;
  totalPosts: number;
  photos: number;
  videos: number;
  comments: number;
  likes: number;
  follows: number;
  dailyUsers: DailyCount[];
  dailyAppOpens: DailyCount[];
  dailyLoginFails: DailyCount[];
  avgSessionMinutes: number;
};
type MetricsResult = { notAdmin: true } | { notAdmin: false; metrics: Metrics };

async function getSessionUser() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

function toDayKey(d: string | Date) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

function buildLast7() {
  const arr: DailyCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push({ date: toDayKey(d), count: 0 });
  }
  return arr;
}

async function fetchMetrics(userId: string): Promise<MetricsResult> {
  const svc = createServiceClient();
  const resolveProfilesTable = async () => {
    const probe = await svc
      .from(PROFILES_TABLE)
      .select("*", { count: "exact", head: true });
    if (probe.error && probe.error.code === "42P01") {
      return PROFILES_TABLE_FALLBACK;
    }
    return PROFILES_TABLE;
  };

  const adminCheck = await svc
    .from("admin_users")
    .select("uid")
    .eq("uid", userId)
    .maybeSingle();

  if (!adminCheck.data) {
    return { notAdmin: true };
  }

  const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const profilesTable = await resolveProfilesTable();

  let usersLast7: PostgrestSingleResponse<{ created_at?: string; createdAt?: string }[]> =
    await svc.from(profilesTable).select("createdAt").gte("createdAt", since7);

  if (usersLast7.error && usersLast7.error.code === "42703") {
    usersLast7 = await svc
      .from(profilesTable)
      .select("created_at")
      .gte("created_at", since7);
  }

  const [
    users,
    posts,
    photos,
    videos,
    comments,
    likes,
    follows,
    eventsLast7,
    authEventsLast7,
  ] = await Promise.all([
    svc.from(profilesTable).select("*", { count: "exact", head: true }),
    svc.from(POSTS_TABLE).select("id", { count: "exact", head: true }),
    svc
      .from(POSTS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("media_type", "image"),
    svc
      .from(POSTS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("media_type", "video"),
    svc.from(POST_COMMENTS_TABLE).select("id", { count: "exact", head: true }),
    svc.from(POST_LIKES_TABLE).select("post_id", { count: "exact", head: true }),
    svc.from(FOLLOWS_TABLE).select("follower", { count: "exact", head: true }),
    svc.from("app_events").select("event, created_at, session_id").gte("created_at", since7),
    svc.from("auth_events").select("event, created_at").gte("created_at", since7),
  ]);

  const dailyUsers = buildLast7();
  (usersLast7.data || []).forEach((row: any) => {
    const key = toDayKey(row.createdAt ?? row.created_at);
    const slot = dailyUsers.find((d) => d.date === key);
    if (slot) slot.count += 1;
  });

  const dailyAppOpens = buildLast7();
  (eventsLast7.data || [])
    .filter((row: any) => row.event === "app_open")
    .forEach((row: any) => {
      const key = toDayKey(row.created_at);
      const slot = dailyAppOpens.find((d) => d.date === key);
      if (slot) slot.count += 1;
    });

  const dailyLoginFails = buildLast7();
  (authEventsLast7.data || [])
    .filter((row: any) => row.event === "login_failed")
    .forEach((row: any) => {
      const key = toDayKey(row.created_at);
      const slot = dailyLoginFails.find((d) => d.date === key);
      if (slot) slot.count += 1;
    });

  // rough session duration: difference between min/max per session_id
  const sessionDurations: number[] = [];
  const sessions: Record<string, { min: number; max: number }> = {};
  (eventsLast7.data || []).forEach((row: any) => {
    if (!row.session_id) return;
    const ts = new Date(row.created_at).getTime();
    const s = sessions[row.session_id] ?? { min: ts, max: ts };
    s.min = Math.min(s.min, ts);
    s.max = Math.max(s.max, ts);
    sessions[row.session_id] = s;
  });
  Object.values(sessions).forEach((s) => {
    if (s.max > s.min) {
      sessionDurations.push((s.max - s.min) / 1000 / 60); // minutes
    }
  });
  const avgSessionMinutes =
    sessionDurations.length > 0
      ? Number((sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length).toFixed(2))
      : 0;

  return {
    notAdmin: false,
    metrics: {
      totalUsers: users.count ?? 0,
      totalPosts: posts.count ?? 0,
      photos: photos.count ?? 0,
      videos: videos.count ?? 0,
      comments: comments.count ?? 0,
      likes: likes.count ?? 0,
      follows: follows.count ?? 0,
      dailyUsers,
      dailyAppOpens,
      dailyLoginFails,
      avgSessionMinutes,
    },
  };
}

function Spark({ data, title }: { data: DailyCount[]; title: string }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        {data.map((d) => `${d.date.slice(5)}:${d.count}`).join("  ")}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const result = await fetchMetrics(user.id);

  if (result.notAdmin) {
    return (
      <div className="container">
        <h2>Not authorized</h2>
        <p>You are not authorized to view this dashboard.</p>
      </div>
    );
  }

  const m = result.metrics;
  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 16 }}>
        <div>
          <h2>Tayp Admin</h2>
          <p style={{ color: "#94a3b8" }}>Overview of key metrics</p>
        </div>
      </div>
      <div className="grid grid-3">
        <div className="card"><h4>Users</h4><p>{m.totalUsers}</p></div>
        <div className="card"><h4>Posts</h4><p>{m.totalPosts}</p></div>
        <div className="card"><h4>Photos</h4><p>{m.photos}</p></div>
        <div className="card"><h4>Videos</h4><p>{m.videos}</p></div>
        <div className="card"><h4>Comments</h4><p>{m.comments}</p></div>
        <div className="card"><h4>Likes</h4><p>{m.likes}</p></div>
        <div className="card"><h4>Follows</h4><p>{m.follows}</p></div>
        <div className="card"><h4>Avg session (min)</h4><p>{m.avgSessionMinutes}</p></div>
      </div>
      <div className="grid" style={{ marginTop: 16 }}>
        <Spark data={m.dailyUsers} title="New users (7d)" />
        <Spark data={m.dailyAppOpens} title="App opens (7d)" />
        <Spark data={m.dailyLoginFails} title="Login fails (7d)" />
      </div>
    </div>
  );
}
