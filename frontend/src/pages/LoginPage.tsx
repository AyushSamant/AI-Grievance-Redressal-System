// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!username.trim() || !password) {
      setErr("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      await refresh();
      nav("/home", { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setErr(err?.response?.data?.detail ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    background: "#F9FAFB", border: "1.5px solid #DDE1E7",
    borderRadius: 10, fontSize: 14, color: "#111827",
    outline: "none", transition: "border-color 0.15s",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFFBEF 0%, #FEF3DC 40%, #F0F2F6 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "fixed", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(245,166,35,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -100, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(245,166,35,0.05)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, background: "#F5A623", borderRadius: 20,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, marginBottom: 16,
            boxShadow: "0 8px 24px rgba(245,166,35,0.4)",
          }}>⚖️</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>
            GrievanceAI
          </h1>
          <p style={{ fontSize: 12.5, color: "#6B7280", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
            Smart Governance Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          border: "1px solid rgba(245,166,35,0.2)",
        }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 24px" }}>
            Sign in to access your grievance portal
          </p>

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Username
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#F5A623")}
                onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#F5A623")}
                onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
              />
            </div>

            {err && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 13, color: "#DC2626", marginBottom: 16,
              }}>
                ❌ {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#FCD06A" : "#F5A623",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(245,166,35,0.4)",
                transition: "all 0.15s",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {loading ? "🔄 Signing in…" : "🚀 Sign In"}
            </button>
          </form>
        </div>

        {/* Role hints */}
        <div style={{
          marginTop: 20, background: "rgba(255,255,255,0.7)",
          borderRadius: 12, padding: "14px 16px",
          border: "1px solid rgba(245,166,35,0.2)",
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Account Roles
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { role: "CITIZEN", desc: "File & track complaints", color: "#059669", bg: "#ECFDF5" },
              { role: "OFFICER", desc: "Manage department cases", color: "#6D28D9", bg: "#F5F3FF" },
              { role: "ADMIN",   desc: "Full system access", color: "#B45309", bg: "#FFFBEB" },
            ].map(r => (
              <div key={r.role} style={{ background: r.bg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: r.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.role}</div>
                <div style={{ fontSize: 9.5, color: "#6B7280", marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 10 }}>
            Create users via Django Admin → Users → Add User → set Role field
          </div>
        </div>
      </div>
    </div>
  );
}