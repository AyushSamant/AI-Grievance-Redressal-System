// src/pages/OfficerPage.tsx
import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { getComplaints, updateStatus } from "../api/complaints";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import type { ComplaintListItem, ComplaintStatus } from "../types";
import { ALLOWED_TRANSITIONS } from "../types";

interface Toast { id: number; msg: string; from: string; to: string; type: "success"|"error" }

// Portal toast — renders outside Layout so it can never be clipped
function ToastPortal({ toasts, remove }: { toasts: Toast[]; remove: (id:number)=>void }) {
  return ReactDOM.createPortal(
    <div style={{ position:"fixed", top:24, right:24, zIndex:99999, display:"flex", flexDirection:"column", gap:12, maxWidth:400, pointerEvents:"none" }}>
      <style>{`
        @keyframes toastSlide {
          from { transform: translateX(110%) scale(0.9); opacity: 0; }
          to   { transform: translateX(0)   scale(1);   opacity: 1; }
        }
      `}</style>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="success"
            ? "linear-gradient(135deg,#065F46,#047857)"
            : "linear-gradient(135deg,#7F1D1D,#B91C1C)",
          borderRadius:14, padding:"16px 20px",
          boxShadow:"0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          animation:"toastSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
          pointerEvents:"all",
          borderLeft: t.type==="success" ? "4px solid #34D399" : "4px solid #FCA5A5",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ color:"#fff", fontWeight:800, fontSize:14, marginBottom:6 }}>
                {t.type==="success" ? "✅ Status Updated!" : "❌ Error"}
              </div>
              <div style={{ color:"rgba(255,255,255,0.85)", fontSize:12.5, lineHeight:1.5, marginBottom: t.from ? 10 : 0 }}>
                {t.msg}
              </div>
              {t.from && t.to && (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ background:"rgba(255,255,255,0.15)", color:"#fff", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, letterSpacing:"0.04em" }}>
                    {t.from}
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:16 }}>→</span>
                  <span style={{ background:"rgba(255,255,255,0.25)", color:"#fff", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, letterSpacing:"0.04em" }}>
                    {t.to}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={()=>remove(t.id)}
              style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", color:"rgba(255,255,255,0.8)", fontSize:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.25)")}
              onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.12)")}
            >✕</button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}

const STATUS_LABELS: Record<string,string> = {
  SUBMITTED:"Submitted", AI_PROCESSED:"AI Processed", ASSIGNED:"Assigned",
  IN_PROGRESS:"In Progress", RESOLVED:"Resolved", CLOSED:"Closed", REJECTED:"Rejected",
};

export default function OfficerPage() {
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [updating,   setUpdating]   = useState<number|null>(null);
  const [statusSel,  setStatusSel]  = useState<Record<number,string>>({});
  const [notes,      setNotes]      = useState<Record<number,string>>({});
  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const toastId = useRef(1000);

  function addToast(msg: string, from="", to="", type: "success"|"error"="success") {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, msg, from, to, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5500);
  }

  async function load() {
    setLoading(true);
    try { setComplaints(await getComplaints()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const stats = {
    total:    complaints.length,
    active:   complaints.filter(c=>["ASSIGNED","IN_PROGRESS"].includes(c.status)).length,
    resolved: complaints.filter(c=>["RESOLVED","CLOSED"].includes(c.status)).length,
    critical: complaints.filter(c=>c.priority==="CRITICAL").length,
  };

  async function handleUpdate(id: number, fromStatus: string, title: string) {
    const ns = statusSel[id] as ComplaintStatus;
    if (!ns) {
      addToast("Please select a new status from the dropdown.", "", "", "error");
      return;
    }
    setUpdating(id);
    try {
      await updateStatus(id, { status: ns, note: notes[id] ?? "" });
      await load();
      addToast(
        `Complaint #${id} — "${title.length > 32 ? title.slice(0,32)+"…" : title}"`,
        STATUS_LABELS[fromStatus] ?? fromStatus,
        STATUS_LABELS[ns] ?? ns,
        "success"
      );
      setStatusSel(p => { const n={...p}; delete n[id]; return n; });
      setNotes(p => { const n={...p}; delete n[id]; return n; });
    } catch (err: any) {
      addToast(err?.response?.data?.detail ?? "Update failed. Try again.", "", "", "error");
    } finally {
      setUpdating(null);
    }
  }

  const inputSm: React.CSSProperties = {
    padding:"7px 10px", background:"#F9FAFB", border:"1.5px solid #DDE1E7",
    borderRadius:8, fontSize:12, color:"#111827", outline:"none",
    fontFamily:"'Plus Jakarta Sans',sans-serif",
  };

  return (
    <>
      <ToastPortal toasts={toasts} remove={id=>setToasts(p=>p.filter(t=>t.id!==id))} />
      <div>
        <div style={{background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",border:"1px solid #DDD6FE",borderRadius:14,padding:"18px 22px",marginBottom:20}}>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:800,color:"#111827",margin:"0 0 4px"}}>🏛️ Officer Dashboard</h2>
          <p style={{fontSize:12,color:"#5B21B6",margin:0,fontWeight:600}}>Manage your department's complaints and update statuses</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {label:"Total Assigned",value:stats.total,   color:"#F5A623",bg:"#FFFBEB"},
            {label:"Active Cases",  value:stats.active,  color:"#1D4ED8",bg:"#EFF6FF"},
            {label:"Resolved",      value:stats.resolved,color:"#059669",bg:"#ECFDF5"},
            {label:"Critical",      value:stats.critical,color:"#DC2626",bg:"#FEF2F2"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:12,padding:"14px 16px",textAlign:"center",border:`1px solid ${s.color}22`}}>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:"#6B7280",fontWeight:600,marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",borderRadius:14,border:"1px solid #DDE1E7",padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:14,fontWeight:700,color:"#111827",marginBottom:14}}>
            📋 Department Cases — {complaints.length} total
          </div>
          {loading ? (
            <div style={{textAlign:"center",padding:40,color:"#9CA3AF"}}>Loading…</div>
          ) : complaints.length===0 ? (
            <div style={{textAlign:"center",padding:40,color:"#9CA3AF",fontSize:13}}>No complaints assigned yet.</div>
          ) : complaints.map(c=>{
            const validNext=ALLOWED_TRANSITIONS[c.status as ComplaintStatus]??[];
            return (
              <div key={c.id} style={{
                border:"1.5px solid #E5E7EB",borderRadius:12,padding:"14px 16px",marginBottom:12,background:"#FAFAFA",
                borderLeft:c.priority==="CRITICAL"?"4px solid #DC2626":c.priority==="HIGH"?"4px solid #F5A623":"4px solid #E5E7EB",
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:13,fontWeight:700,color:"#111827",marginBottom:6}}>
                      #{c.id} — {c.title}
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <StatusBadge status={c.status as ComplaintStatus}/>
                      <PriorityBadge priority={c.priority}/>
                      {c.department_name&&<span style={{background:"#F0F9FF",color:"#0369A1",borderRadius:100,padding:"2px 10px",fontSize:11,fontWeight:600}}>🏛️ {c.department_name}</span>}
                    </div>
                  </div>
                  <div style={{fontSize:10,color:"#9CA3AF",flexShrink:0}}>
                    {new Date(c.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                  </div>
                </div>
                {validNext.length>0?(
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",paddingTop:10,borderTop:"1px solid #E5E7EB"}}>
                    <select value={statusSel[c.id]??""} onChange={e=>setStatusSel(p=>({...p,[c.id]:e.target.value}))} style={{...inputSm,minWidth:150}}>
                      <option value="">Move to…</option>
                      {validNext.map(s=><option key={s} value={s}>{STATUS_LABELS[s]??s}</option>)}
                    </select>
                    <input placeholder="Note (optional)" value={notes[c.id]??""} onChange={e=>setNotes(p=>({...p,[c.id]:e.target.value}))} style={{...inputSm,flex:1,minWidth:140}}/>
                    <button
                      onClick={()=>handleUpdate(c.id,c.status,c.title)}
                      disabled={updating===c.id||!statusSel[c.id]}
                      style={{padding:"7px 18px",borderRadius:8,border:"none",background:(!statusSel[c.id]||updating===c.id)?"#DDE1E7":"#7C3AED",color:"#fff",fontSize:12,fontWeight:700,cursor:(!statusSel[c.id]||updating===c.id)?"not-allowed":"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap",transition:"background 0.15s"}}
                    >
                      {updating===c.id?"Updating…":"✓ Update"}
                    </button>
                  </div>
                ):(
                  <div style={{paddingTop:8,borderTop:"1px solid #E5E7EB",fontSize:11,color:"#9CA3AF",fontStyle:"italic"}}>
                    Terminal state — no further updates.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}