// src/pages/AdminPage.tsx
import { useEffect, useState } from "react";
import { getComplaints, getAnalytics, assignDepartment, updateStatus, getDepartments } from "../api/complaints";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import type { ComplaintListItem, ComplaintStatus } from "../types";
import { STATUS_COLORS, PRIORITY_COLORS, ALLOWED_TRANSITIONS } from "../types";

export default function AdminPage() {
  const [complaints,   setComplaints]   = useState<ComplaintListItem[]>([]);
  const [analytics,    setAnalytics]    = useState<Record<string,number> | null>(null);
  const [departments,  setDepartments]  = useState<{id:number;name:string}[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<"analytics"|"assign"|"manage">("analytics");
  const [assignMap,    setAssignMap]    = useState<Record<number,string>>({});
  const [statusSel,    setStatusSel]    = useState<Record<number,string>>({});
  const [notes,        setNotes]        = useState<Record<number,string>>({});
  const [saving,       setSaving]       = useState<number|null>(null);
  const [toast,        setToast]        = useState<string|null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const [c, a, d] = await Promise.all([getComplaints(), getAnalytics(), getDepartments()]);
      setComplaints(c);
      setAnalytics(a);
      setDepartments(d);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // Complaints missing a department
  const unassigned = complaints.filter(c => !c.department_name || c.department_name === "Unknown");

  async function doAssign(id: number) {
    const dept = assignMap[id];
    if (!dept) return;
    setSaving(id);
    try {
      await assignDepartment(id, dept);
      showToast(`✅ Complaint #${id} assigned to ${dept}`);
      await load();
    } catch { showToast("❌ Assignment failed — check backend."); }
    finally { setSaving(null); }
  }

  async function doStatusUpdate(id: number) {
    const ns = statusSel[id] as ComplaintStatus;
    if (!ns) return;
    setSaving(id);
    try {
      await updateStatus(id, { status: ns, note: notes[id] ?? "" });
      showToast(`✅ Complaint #${id} → ${ns}`);
      await load();
    } catch { showToast("❌ Status update failed."); }
    finally { setSaving(null); }
  }

  const total    = complaints.length;
  const resolved = complaints.filter(c => ["RESOLVED","CLOSED"].includes(c.status)).length;
  const active   = complaints.filter(c => ["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS"].includes(c.status)).length;
  const critical = complaints.filter(c => c.priority === "CRITICAL").length;
  const slaComp  = total ? Math.round((resolved / total) * 100) : 0;

  const statusData = Object.entries(
    complaints.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {} as Record<string,number>)
  ).map(([name, value]) => ({ name: name.replace("_"," "), value, color: STATUS_COLORS[name] }));

  const priorityData = Object.entries(
    complaints.reduce((acc, c) => ({ ...acc, [c.priority]: (acc[c.priority] ?? 0) + 1 }), {} as Record<string,number>)
  ).map(([name, value]) => ({ name, value, color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] }));

  const deptData = Object.entries(
    complaints.reduce((acc, c) => {
      const d = c.department_name ?? "Unassigned";
      return { ...acc, [d]: (acc[d] ?? 0) + 1 };
    }, {} as Record<string,number>)
  ).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const inputSm: React.CSSProperties = {
    padding:"7px 10px", background:"#F9FAFB", border:"1.5px solid #DDE1E7",
    borderRadius:8, fontSize:12, color:"#111827", outline:"none",
    fontFamily:"'Plus Jakarta Sans', sans-serif",
  };

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:700,
    cursor:"pointer", border:"none",
    background: active ? "#F5A623" : "#F0F2F6",
    color: active ? "#fff" : "#6B7280",
    transition:"all 0.15s",
  });

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:300 }}>
      <div style={{ textAlign:"center",color:"#9CA3AF" }}>
        <div style={{ fontSize:32,marginBottom:8 }}>⏳</div>Loading admin data…
      </div>
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:80, right:24, zIndex:9999,
          background:"#111827", color:"#fff", borderRadius:10,
          padding:"12px 20px", fontSize:13, fontWeight:600,
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)", animation:"fadeUp 0.2s ease",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#FEF2F2,#FEE2E2)", border:"1px solid #FECACA", borderRadius:14, padding:"18px 22px", marginBottom:20 }}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:800, color:"#111827", margin:"0 0 4px" }}>
          🛡️ Admin Control Panel
        </h2>
        <p style={{ fontSize:12, color:"#991B1B", margin:0, fontWeight:600 }}>
          Full system oversight · Analytics · Department assignment · All complaints
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
        {[
          { l:"Total",       v:total,        c:"#F5A623", bg:"#FFFBEB" },
          { l:"Resolved",    v:resolved,     c:"#059669", bg:"#ECFDF5" },
          { l:"Active",      v:active,       c:"#1D4ED8", bg:"#EFF6FF" },
          { l:"Critical",    v:critical,     c:"#DC2626", bg:"#FEF2F2" },
          { l:"Unassigned",  v:unassigned.length, c:"#D97706", bg:"#FFFBEB" },
        ].map(s => (
          <div key={s.l} style={{ background:s.bg, borderRadius:12, padding:"14px 16px", textAlign:"center", border:`1px solid ${s.c}22`, cursor:s.l==="Unassigned"?'pointer':'default' }}
            onClick={() => s.l === "Unassigned" && setActiveTab("assign")}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:"#6B7280", fontWeight:600, marginTop:3 }}>{s.l}</div>
            {s.l === "Unassigned" && s.v > 0 && (
              <div style={{ fontSize:9.5, color:s.c, marginTop:3, fontWeight:700 }}>Click to assign →</div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <button style={TAB_STYLE(activeTab==="analytics")} onClick={() => setActiveTab("analytics")}>📊 Analytics</button>
        <button style={TAB_STYLE(activeTab==="assign")} onClick={() => setActiveTab("assign")}>
          🏛️ Assign Departments
          {unassigned.length > 0 && (
            <span style={{ marginLeft:6, background:"#DC2626", color:"#fff", borderRadius:100, padding:"1px 7px", fontSize:10, fontWeight:800 }}>
              {unassigned.length}
            </span>
          )}
        </button>
        <button style={TAB_STYLE(activeTab==="manage")} onClick={() => setActiveTab("manage")}>📋 Manage All</button>
      </div>

      {/* ── ANALYTICS TAB ──────────────────────────────────────────────── */}
      {activeTab === "analytics" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #DDE1E7", padding:"16px" }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Status Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {statusData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>
                {statusData.map(s => (
                  <span key={s.name} style={{ display:"flex",alignItems:"center",gap:3,fontSize:9.5,color:"#4B5563",fontWeight:600 }}>
                    <span style={{ width:7,height:7,borderRadius:"50%",background:s.color }} />{s.name}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #DDE1E7", padding:"16px" }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Priority Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData} margin={{ top:5,right:10,left:-20,bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F6" />
                  <XAxis dataKey="name" tick={{ fontSize:10,fill:"#6B7280" }} />
                  <YAxis tick={{ fontSize:10,fill:"#6B7280" }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {priorityData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #DDE1E7", padding:"16px" }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>Department Workload</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData.slice(0,7)} layout="vertical" margin={{ top:0,right:20,left:70,bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F6" />
                  <XAxis type="number" tick={{ fontSize:10,fill:"#6B7280" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9,fill:"#6B7280" }} width={85} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F5A623" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA summary */}
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #DDE1E7", padding:"16px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {[
              { label:"Resolution Rate", value:`${slaComp}%`, color:"#059669", icon:"✅" },
              { label:"Departments", value:deptData.filter(d=>d.name!=="Unassigned").length, color:"#1D4ED8", icon:"🏛️" },
              { label:"Needs Assignment", value:unassigned.length, color:"#D97706", icon:"⚠️" },
              { label:"System Health", value:"95%", color:"#7C3AED", icon:"⚡" },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center", padding:"10px" }}>
                <div style={{ fontSize:24 }}>{s.icon}</div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:800, color:s.color, margin:"4px 0" }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#6B7280", fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ASSIGN DEPARTMENT TAB ──────────────────────────────────────── */}
      {activeTab === "assign" && (
        <div>
          <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"14px 16px", marginBottom:16, fontSize:13, color:"#92400E" }}>
            <strong>⚠️ {unassigned.length} complaint(s)</strong> have no department assigned. 
            AI routing may have failed. Assign them manually below.
          </div>

          {unassigned.length === 0 ? (
            <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:12, padding:"40px", textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#059669" }}>All complaints have departments assigned!</div>
            </div>
          ) : unassigned.map(c => (
            <div key={c.id} style={{
              background:"#fff", borderRadius:12, border:"1.5px solid #FDE68A",
              borderLeft:"4px solid #F5A623", padding:"14px 16px", marginBottom:10,
              boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#111827", marginBottom:5 }}>
                    #{c.id} — {c.title}
                  </div>
                  <div style={{ fontSize:12, color:"#6B7280", marginBottom:8, lineHeight:1.5 }}>
                    {c.description?.slice(0,120)}{(c.description?.length ?? 0) > 120 ? "…" : ""}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    {c.category && (
                      <span style={{ fontSize:10.5, color:"#7C3AED", fontWeight:700, background:"#F5F3FF", padding:"2px 8px", borderRadius:100 }}>
                        🏷️ {c.category}
                      </span>
                    )}
                    <span style={{ fontSize:10.5, color:"#D97706", fontWeight:700, background:"#FFFBEB", padding:"2px 8px", borderRadius:100 }}>
                      ⚠️ No Department
                    </span>
                  </div>
                </div>

                {/* Assignment panel */}
                <div style={{ background:"#FFFBEF", border:"1.5px solid #FAD898", borderRadius:10, padding:"12px 14px", minWidth:260, flexShrink:0 }}>
                  <div style={{ fontSize:9.5, fontWeight:800, color:"#92400E", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
                    🏛️ Assign Department
                  </div>
                  <select
                    value={assignMap[c.id] ?? ""}
                    onChange={e => setAssignMap(p => ({ ...p, [c.id]: e.target.value }))}
                    style={{ ...inputSm, width:"100%", marginBottom:8 }}
                  >
                    <option value="">Select department…</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => doAssign(c.id)}
                    disabled={!assignMap[c.id] || saving === c.id}
                    style={{
                      width:"100%", padding:"9px",
                      background: assignMap[c.id] ? "#F5A623" : "#E2E8F0",
                      color: assignMap[c.id] ? "#fff" : "#9CA3AF",
                      border:"none", borderRadius:8, fontSize:12.5, fontWeight:700,
                      cursor: assignMap[c.id] ? "pointer" : "not-allowed",
                      fontFamily:"'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {saving === c.id ? "Assigning…" : "🏛️ Assign Department"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Also show already-assigned complaints for reassignment */}
          {complaints.filter(c => c.department_name && c.department_name !== "Unknown").length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:"#6B7280", marginBottom:10 }}>
                Reassign existing departments
              </div>
              {complaints.filter(c => c.department_name && c.department_name !== "Unknown").slice(0,5).map(c => (
                <div key={c.id} style={{ background:"#F9FAFB", borderRadius:10, border:"1px solid #DDE1E7", padding:"12px 16px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#111827" }}>#{c.id} — {c.title}</div>
                    <div style={{ fontSize:11, color:"#1D4ED8", fontWeight:700, marginTop:3 }}>Currently: {c.department_name}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <select
                      value={assignMap[c.id] ?? ""}
                      onChange={e => setAssignMap(p => ({ ...p, [c.id]: e.target.value }))}
                      style={{ ...inputSm }}
                    >
                      <option value="">Reassign…</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    <button onClick={() => doAssign(c.id)} disabled={!assignMap[c.id] || saving === c.id}
                      style={{ padding:"7px 14px", background: assignMap[c.id]?"#F5A623":"#DDE1E7", color: assignMap[c.id]?"#fff":"#9CA3AF", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {saving === c.id ? "…" : "Reassign"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE ALL TAB ─────────────────────────────────────────────── */}
      {activeTab === "manage" && (
        <div style={{ background:"#fff", borderRadius:14, border:"1px solid #DDE1E7", padding:"16px 18px" }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:"#111827", marginBottom:14 }}>
            📋 All Complaints — {total}
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"#F9FAFB" }}>
                  {["ID","Title","Status","Priority","Department","Urgency","Action"].map(h => (
                    <th key={h} style={{ padding:"9px 10px", textAlign:"left", color:"#6B7280", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:"1px solid #DDE1E7", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, i) => {
                  const validNext = ALLOWED_TRANSITIONS[c.status] ?? [];
                  return (
                    <tr key={c.id} style={{ background: i%2===0?"#fff":"#FAFAFA", borderBottom:"1px solid #F0F2F6" }}>
                      <td style={{ padding:"9px 10px", fontFamily:"monospace", color:"#D4891A", fontWeight:700 }}>#{c.id}</td>
                      <td style={{ padding:"9px 10px", color:"#111827", fontWeight:600, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</td>
                      <td style={{ padding:"9px 10px" }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding:"9px 10px" }}><PriorityBadge priority={c.priority} /></td>
                      <td style={{ padding:"9px 10px", color:"#1D4ED8", fontSize:11, fontWeight:600, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.department_name ?? "⚠️ Unassigned"}</td>
                      <td style={{ padding:"9px 10px", color:"#DC2626", fontWeight:700 }}>{c.urgency_score ?? "—"}</td>
                      <td style={{ padding:"9px 10px" }}>
                        {validNext.length > 0 && (
                          <div style={{ display:"flex", gap:4 }}>
                            <select value={statusSel[c.id]??""} onChange={e=>setStatusSel(p=>({...p,[c.id]:e.target.value}))} style={{ ...inputSm, fontSize:11 }}>
                              <option value="">Move to…</option>
                              {validNext.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
                            </select>
                            <button onClick={()=>doStatusUpdate(c.id)} disabled={!statusSel[c.id]||saving===c.id}
                              style={{ padding:"6px 10px", background:statusSel[c.id]?"#F5A623":"#DDE1E7", color:statusSel[c.id]?"#fff":"#9CA3AF", border:"none", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                              {saving===c.id?"…":"✅"}
                            </button>
                          </div>
                        )}
                        {validNext.length===0 && <span style={{ fontSize:10, color:"#9CA3AF" }}>{c.status}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}