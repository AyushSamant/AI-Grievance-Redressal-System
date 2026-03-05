// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { getComplaints, getAnalytics } from "../api/complaints";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import type { ComplaintListItem } from "../types";
import { STATUS_COLORS, PRIORITY_COLORS } from "../types";
import { formatDistanceToNow } from "date-fns";

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, delta, accent }: {
  icon: string; label: string; value: string | number;
  delta?: string; accent: string;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: "1px solid #DDE1E7",
      borderTop: `3px solid ${accent}`,
      padding: "18px 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 10 }}>
        {icon}
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      {delta && <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginTop: 4 }}>↑ {delta}</div>}
    </div>
  );
}

// ── Chart Card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #DDE1E7",
      padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14,
        fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user }            = useAuth();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [analytics, setAnalytics]   = useState<Record<string, number> | null>(null);
  const [loading, setLoading]       = useState(true);
  const role = user?.role ?? "CITIZEN";

  useEffect(() => {
    Promise.all([getComplaints(), getAnalytics()])
      .then(([c, a]) => {
        setComplaints(c);
        setAnalytics(a);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total    = complaints.length;
  const resolved = complaints.filter(c => ["RESOLVED","CLOSED"].includes(c.status)).length;
  const active   = complaints.filter(c => ["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS"].includes(c.status)).length;
  const critical = complaints.filter(c => c.priority === "CRITICAL").length;

  // Charts data
  const statusData = Object.entries(
    complaints.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_"," "), value, color: STATUS_COLORS[name] }));

  const priorityData = Object.entries(
    complaints.reduce((acc, c) => ({ ...acc, [c.priority]: (acc[c.priority] ?? 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] }));

  const deptData = Object.entries(
    complaints.reduce((acc, c) => {
      const d = c.department_name ?? "Unknown";
      return { ...acc, [d]: (acc[d] ?? 0) + 1 };
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,7);

  // 14-day trend
  const trendMap: Record<string, number> = {};
  complaints.forEach(c => {
    const d = new Date(c.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
    trendMap[d] = (trendMap[d] ?? 0) + 1;
  });
  const trendData = Object.entries(trendMap).slice(-14).map(([date, count]) => ({ date, count }));

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
          <div style={{ color:"#6B7280", fontSize:14 }}>Loading dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{
        background: "linear-gradient(135deg,#FFFBEF,#FEF3DC)",
        border: "1px solid #FAD898", borderRadius: 14,
        padding: "18px 22px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>
            {{ ADMIN:"System Dashboard",OFFICER:"Department Dashboard",CITIZEN:"My Dashboard" }[role]}
          </h2>
          <p style={{ fontSize:12, color:"#92400E", margin:0, fontWeight:600 }}>
            Empowering efficient citizen service delivery
          </p>
        </div>
        <div style={{
          background:"#ECFDF5", border:"1px solid #A7F3D0",
          borderRadius:100, padding:"5px 14px",
          fontSize:11, fontWeight:700, color:"#059669",
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:"#059669",animation:"pulse 1.5s infinite" }} />
          System Online
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        <KPI icon="📋" label="Total Complaints" value={total} delta="12% from last month" accent="#F5A623" />
        <KPI icon="✅" label="Resolved" value={resolved} delta="8% from last month" accent="#059669" />
        <KPI icon="⏳" label="Active Cases" value={active} accent="#1D4ED8" />
        <KPI icon="🔴" label="Critical Priority" value={critical} accent="#DC2626" />
      </div>

      {/* Charts row — officer/admin only */}
      {role !== "CITIZEN" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
            {/* Status donut */}
            <ChartCard title="Status Distribution">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, String(n)]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                {statusData.map(s => (
                  <span key={s.name} style={{ display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#4B5563",fontWeight:600 }}>
                    <span style={{ width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0 }} />{s.name}
                  </span>
                ))}
              </div>
            </ChartCard>

            {/* Priority bar */}
            <ChartCard title="Priority Breakdown">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F6" />
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:"#6B7280" }} />
                  <YAxis tick={{ fontSize:10, fill:"#6B7280" }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Filing trend */}
            <ChartCard title="14-Day Trend">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F6" />
                  <XAxis dataKey="date" tick={{ fontSize:9, fill:"#6B7280" }} />
                  <YAxis tick={{ fontSize:10, fill:"#6B7280" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#F5A623" strokeWidth={2.5} dot={{ fill:"#F5A623", r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Department workload */}
          {deptData.length > 0 && (
            <ChartCard title="Department Workload">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={deptData} layout="vertical" margin={{ top:0, right:20, left:60, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F6" />
                  <XAxis type="number" tick={{ fontSize:10, fill:"#6B7280" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:"#6B7280" }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F5A623" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}

      {/* Recent complaints feed */}
      <div style={{ marginTop:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:"#111827" }}>
              🔴 {role === "CITIZEN" ? "My Complaints" : "Recent Complaints"}
            </div>
            <div style={{ fontSize:11, color:"#F59E0B", fontWeight:700 }}>{total} total • Live feed</div>
          </div>
        </div>

        {complaints.slice(0,6).map(c => (
          <div key={c.id} style={{
            background:"#fff", borderRadius:12, border:"1px solid #DDE1E7",
            borderLeft:`4px solid ${PRIORITY_COLORS[c.priority] ?? "#F5A623"}`,
            padding:"14px 16px", marginBottom:8,
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13.5, color:"#111827", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                #{c.id} — {c.title}
              </div>
              <div style={{ fontSize:11.5, color:"#6B7280", marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {c.description}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
                {c.department_name && (
                  <span style={{ fontSize:10.5, color:"#1D4ED8", fontWeight:700 }}>🏛️ {c.department_name}</span>
                )}
                <span style={{ fontSize:10, color:"#9CA3AF", fontFamily:"monospace" }}>
                  🕐 {formatDistanceToNow(new Date(c.created_at), { addSuffix:true })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {complaints.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#9CA3AF" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            <div style={{ fontSize:14, fontWeight:600 }}>No complaints yet</div>
            <div style={{ fontSize:12 }}>File one from the Complaints section</div>
          </div>
        )}
      </div>
    </div>
  );
}