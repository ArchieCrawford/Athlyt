"use client";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabaseClient";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Admin Login</h2>
      <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
      </form>
    </div>
  );
}
