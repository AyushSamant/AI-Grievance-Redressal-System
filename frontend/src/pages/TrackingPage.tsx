// src/pages/TrackingPage.tsx
import { useEffect, useState } from "react";
import { getComplaints, getComplaint } from "../api/complaints";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import type { ComplaintListItem, ComplaintDetail } from "../types";
import { STATUS_ORDER, STATUS_COLORS } from "../types";
import { formatDistanceToNow, format } from "date-fns";

function ProgressBar({ status }: { status: string }) {
  const idx = STATUS_ORDER.indexOf(status as never);
  const pct = idx < 0 ? 0 : Math.round((idx / (STATUS_ORDER.length - 1)) * 100);
  const color = status === "RESOLVED" || status === "CLOSED" ? "#059669" : "#F5A623";
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#9CA3AF", marginBottom:4 }}>
        <span>Resolution Progress</span><span style={{ fontWeight:700 }}>{pct}%</span>
      </div>
      <div style={{ height:7, background:"#F0F2F6", borderRadius:4, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}CC)`, borderRadius:4, transition:"width 0.5s" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {STATUS_ORDER.map((s, i) => (
          <span key={s} style={{
            fontSize:8, fontWeight: i <= idx ? 700 : 400,
            color: i <= idx ? "#F5A623" : "#D1D5DB",
          }}>{s.replace("_"," ")}</span>
        ))}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [selected, setSelected]     = useState<ComplaintDetail | null>(null);
  const [loading, setLoading]       = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const role = user?.role ?? "CITIZEN";

  useEffect(() => {
    getComplaints().then(setComplaints).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function openDetail(id: number) {
    setDetailLoading(true);
    try { setSelected(await getComplaint(id)); }
    catch { alert("Could not load complaint details."); }
    finally { setDetailLoading(false); }
  }

  const filtered = complaints.filter(c => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (search && !`${c.id} ${c.title}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const inputSm: React.CSSProperties = {
    padding:"8px 12px", background:"#F9FAFB", border:"1.5px solid #DDE1E7",
    borderRadius:8, fontSize:12.5, color:"#111827", outline:"none",
    fontFamily:"'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background:"#fff", border:"1px solid #DDE1E7", borderRadius:14, padding:"14px 20px", marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:"#111827", margin:"0 0 3px" }}>
          🔍 Track Complaint Status
        </h2>
        <p style={{ fontSize:12, color:"#6B7280", margin:0 }}>
          {role === "CITIZEN" ? "Monitor your grievances · View full history timeline" : "Monitor all complaints across departments"}
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:18 }}>
        {/* Left — list */}
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or title…" style={{ ...inputSm, flex:1 }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputSm}>
              <option value="ALL">All</option>
              {["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REJECTED"].map(s => (
                <option key={s} value={s}>{s.replace("_"," ")}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:"#9CA3AF" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:40, color:"#9CA3AF" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>📭</div>No complaints found
            </div>
          ) : filtered.map(c => (
            <div
              key={c.id}
              onClick={() => openDetail(c.id)}
              style={{
                background: selected?.id === c.id ? "#FFFBEB" : "#fff",
                border: selected?.id === c.id ? "1.5px solid #F5A623" : "1px solid #DDE1E7",
                borderRadius:11, padding:"12px 14px", marginBottom:8,
                cursor:"pointer", boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
                transition:"all 0.15s",
              }}
            >
              <div style={{ fontWeight:700, fontSize:13, color:"#111827", marginBottom:4 }}>
                #{c.id} — {c.title}
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
                <span style={{ fontSize:10, color:"#9CA3AF", marginLeft:"auto" }}>
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix:true })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right — detail */}
        <div>
          {detailLoading ? (
            <div style={{ textAlign:"center", padding:60, color:"#9CA3AF" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>Loading detail…
            </div>
          ) : !selected ? (
            <div style={{ background:"#F9FAFB", border:"1.5px dashed #DDE1E7", borderRadius:14, padding:"50px 30px", textAlign:"center", color:"#9CA3AF" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>👈</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Select a complaint to view details</div>
            </div>
          ) : (
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid #DDE1E7", padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#111827", marginBottom:14 }}>
                #{selected.id} — {selected.title}
              </div>

              {/* Description */}
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 12px", marginBottom:14, fontSize:12.5, color:"#374151", lineHeight:1.6 }}>
                {selected.description}
              </div>

              {/* Details grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[
                  { label:"Category",   value: selected.category ?? "—",         color:"#6D28D9" },
                  { label:"Department", value: selected.department_name ?? "—",   color:"#1D4ED8" },
                  { label:"Urgency",    value: `${selected.urgency_score ?? "—"}/100`, color:"#DC2626" },
                  { label:"SLA",        value: `${selected.sla_days ?? "—"} days`, color:"#D97706" },
                  { label:"Sentiment",  value: selected.sentiment ?? "—",         color:"#374151" },
                  { label:"Submitted",  value: format(new Date(selected.created_at),"dd MMM, hh:mm a"), color:"#374151" },
                ].map(f => (
                  <div key={f.label} style={{ background:"#F9FAFB", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{f.label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:f.color }}>{f.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom:18 }}>
                <ProgressBar status={selected.status} />
              </div>

              {/* Timeline */}
              <div style={{ fontSize:11, fontWeight:700, color:"#4B5563", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
                📜 History Timeline
              </div>

              {selected.history && selected.history.length > 0 ? (
                <div style={{ position:"relative", paddingLeft:24 }}>
                  <div style={{ position:"absolute", left:8, top:6, bottom:6, width:2, background:"linear-gradient(to bottom, #F5A623, #DDE1E7)", borderRadius:1 }} />
                  {[...selected.history].reverse().map((h, i) => (
                    <div key={h.id ?? i} style={{ position:"relative", marginBottom:14 }}>
                      <div style={{
                        position:"absolute", left:-20, top:6,
                        width:10, height:10, borderRadius:"50%",
                        background: STATUS_COLORS[h.to_status] ?? "#F5A623",
                        border:"2px solid #fff",
                        boxShadow:`0 0 0 2px ${STATUS_COLORS[h.to_status] ?? "#F5A623"}44`,
                      }} />
                      <div style={{ background:"#F9FAFB", borderRadius:8, padding:"8px 10px", border:"1px solid #DDE1E7" }}>
                        <div style={{ fontSize:9.5, color:"#9CA3AF", fontFamily:"monospace", marginBottom:3 }}>
                          {format(new Date(h.created_at), "dd MMM, hh:mm a")}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                          <StatusBadge status={h.from_status} />
                          <span style={{ fontSize:10, color:"#9CA3AF" }}>→</span>
                          <StatusBadge status={h.to_status} />
                        </div>
                        {h.note && <div style={{ fontSize:11, color:"#6B7280", marginTop:3 }}>📝 {h.note}</div>}
                        {h.actor_username && <div style={{ fontSize:10, color:"#9CA3AF", marginTop:2 }}>👤 by {h.actor_username}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background:"#F9FAFB", borderRadius:8, padding:"14px", textAlign:"center", color:"#9CA3AF", fontSize:12 }}>
                  No history yet — complaint just submitted.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}