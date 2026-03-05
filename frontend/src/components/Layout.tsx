// src/components/Layout.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RoleBadge } from "./Badge";
import type { ReactNode } from "react";

interface Props { children: ReactNode }

const NAV_ITEMS = [
  { to: "/home",         label: "🏠 Home",       roles: ["CITIZEN","OFFICER","ADMIN"] },
  { to: "/dashboard",   label: "📊 Dashboard",  roles: ["CITIZEN","OFFICER","ADMIN"] },
  { to: "/complaints",  label: "📝 Complaints", roles: ["CITIZEN","OFFICER","ADMIN"] },
  { to: "/tracking",    label: "🔍 Track",      roles: ["CITIZEN","OFFICER","ADMIN"] },
  { to: "/chatbot",     label: "🤖 AI Chat",    roles: ["CITIZEN","OFFICER","ADMIN"] },
  { to: "/admin",       label: "🛡️ Admin",      roles: ["ADMIN"] },
  { to: "/officer",     label: "🏛️ Officer",    roles: ["OFFICER","ADMIN"] },
];

export default function Layout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "CITIZEN";

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role));

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#F0F2F6", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────── */}
      <header style={{
        background: "#FFFFFF",
        borderBottom: "2px solid #F5A623",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Brand row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 24px",
          borderBottom: "1px solid #F0F2F6",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, background: "#F5A623", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, boxShadow: "0 2px 8px rgba(245,166,35,0.35)",
            }}>⚖️</div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
                GrievanceAI
              </div>
              <div style={{ fontSize: 10.5, color: "#9CA3AF", letterSpacing: "0.04em" }}>
                Smart Governance Platform
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#ECFDF5", border: "1px solid #A7F3D0",
              borderRadius: 100, padding: "4px 12px",
              fontSize: 11, fontWeight: 700, color: "#059669",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#059669",
                animation: "pulse 1.5s infinite",
              }} />
              System Online
            </div>

            {/* User chip */}
            {user && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#FFFBEB", border: "1px solid #FDE68A",
                borderRadius: 100, padding: "4px 14px 4px 4px",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#F5A623",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "#fff", fontWeight: 700,
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                    {user.username}
                  </div>
                  <RoleBadge role={user.role} />
                </div>
              </div>
            )}

            <button onClick={handleLogout} style={{
              background: "#FEF2F2", color: "#DC2626",
              border: "1px solid #FECACA", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#DC2626"; (e.target as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "#FEF2F2"; (e.target as HTMLButtonElement).style.color = "#DC2626"; }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Nav link row */}
        <nav style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "0 24px",
          overflowX: "auto",
        }}>
          {visibleNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center",
                padding: "10px 14px",
                fontSize: 12.5, fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "#D4891A" : "#4B5563",
                borderBottom: isActive ? "2px solid #F5A623" : "2px solid transparent",
                transition: "all 0.15s",
                whiteSpace: "nowrap" as const,
                marginBottom: -2,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Page content ──────────────────────────────────────────── */}
      <main style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        {children}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #F5A623; border-radius: 3px; }
      `}</style>
    </div>
  );
}