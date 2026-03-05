// src/pages/ComplaintsPage.tsx
import { useEffect, useRef, useState } from "react";
import { getComplaints, createComplaint, updateStatus } from "../api/complaints";
import { useAuth } from "../hooks/useAuth";
import { StatusBadge, PriorityBadge } from "../components/Badge";
import type { ComplaintListItem, ComplaintStatus } from "../types";
import { ALLOWED_TRANSITIONS } from "../types";

// ── Voice input hook (Web Speech API) ────────────────────────────────────────
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  function toggleListen() {
    if (!supported) { alert("Voice input requires Chrome or Edge browser."); return; }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof SpeechRecognition;
    const r = new SR();
    r.lang = "en-IN";            // Hindi-English mix supported
    r.continuous = true;
    r.interimResults = false;

    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(res => res[0].transcript)
        .join(" ");
      onResult(transcript);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);

    recogRef.current = r;
    r.start();
    setListening(true);
  }

  return { toggleListen, listening, supported };
}

// ── AI Analysis Result panel ──────────────────────────────────────────────────
function AIResultPanel({ data }: { data: ComplaintListItem }) {
  return (
    <div style={{
      background: "#F5F3FF", border: "1px solid #DDD6FE",
      borderRadius: 12, padding: "16px 18px", marginTop: 16,
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#6D28D9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        ✨ AI Analysis Results
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Category",     value: data.category ?? "—",    color: "#6D28D9" },
          { label: "Priority",     value: <PriorityBadge priority={data.priority} /> },
          { label: "Department",   value: data.department_name ?? "Routing…", color: "#1D4ED8" },
          { label: "Sentiment",    value: data.sentiment ?? "—",    color: "#374151" },
          { label: "Urgency",      value: `${data.urgency_score ?? "—"}/100`, color: "#DC2626" },
          { label: "SLA",          value: `${data.sla_days ?? "—"} days`, color: "#D97706" },
        ].map(f => (
          <div key={f.label} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 9.5, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "color" in f ? f.color : "#111827" }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #DDD6FE", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#6D28D9", marginBottom: 4 }}>🤖 AI Response:</div>
        <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.7 }}>
          Your complaint has been categorized as <strong>{data.category}</strong> and routed to{" "}
          <strong>{data.department_name ?? "the appropriate department"}</strong>.{" "}
          Expected resolution in <strong>{data.sla_days ?? "N/A"} days</strong>.{" "}
          Track using ID <strong>#{data.id}</strong>.
        </div>
      </div>
    </div>
  );
}

// ── Citizen: Submit form ──────────────────────────────────────────────────────
function SubmitForm() {
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<ComplaintListItem | null>(null);

  const { toggleListen, listening } = useVoiceInput((text) => {
    setDesc(prev => (prev ? prev + " " + text : text).trim());
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    background: "#F9FAFB", border: "1.5px solid #DDE1E7", borderRadius: 10,
    fontSize: 13.5, color: "#111827", outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: "border-color 0.15s",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || description.trim().length < 20) {
      setError("Title required. Description must be at least 20 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await createComplaint({ title: title.trim(), description: description.trim() });
      setResult(data as unknown as ComplaintListItem);
      setTitle(""); setDesc("");
    } catch (e: unknown) {
      const err = e as { response?: { data?: Record<string, string[]> } };
      const msgs = err?.response?.data;
      setError(msgs ? Object.values(msgs).flat().join(" ") : "Submission failed. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
      {/* Form */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #DDE1E7", padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
          📤 Submit New Complaint
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 20 }}>
          AI auto-classifies urgency, category, and routes to the correct department
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Complaint Title *
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. No water supply in Sector 12 since 3 days"
              style={inputStyle}
              maxLength={200}
              onFocus={e => (e.target.style.borderColor = "#F5A623")}
              onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 10.5, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Detailed Description *
              </label>
              {/* Voice button */}
              <button
                type="button"
                onClick={toggleListen}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: 100,
                  background: listening ? "#FEF2F2" : "#FFFBEB",
                  border: `1px solid ${listening ? "#FECACA" : "#FDE68A"}`,
                  color: listening ? "#DC2626" : "#B45309",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
              >
                {listening ? (
                  <><span style={{ width:7,height:7,borderRadius:"50%",background:"#DC2626",animation:"pulse 0.8s infinite" }} /> Recording…</>
                ) : "🎤 Voice Input"}
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the issue in detail — where, since when, who is affected…"
              style={{ ...inputStyle, height: 130, resize: "vertical" }}
              onFocus={e => (e.target.style.borderColor = "#F5A623")}
              onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
            />
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>
              {description.length} chars · minimum 20
            </div>
          </div>

          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 11.5, color: "#1D4ED8" }}>
            🤖 Priority, category and department are set automatically by AI — you don't need to select them.
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#DC2626", marginBottom: 14 }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "13px",
              background: submitting ? "#FCD06A" : "#F5A623",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 13.5, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(245,166,35,0.3)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {submitting ? "🤖 AI Analyzing & Submitting…" : "🤖 Analyze & Submit"}
          </button>
        </form>

        {result && <AIResultPanel data={result} />}
      </div>

      {/* Side info */}
      <div>
        {[
          { title: "🤖 How AI Works", content: [
            ["🌐","Language Detection","Identifies your language automatically"],
            ["💭","Sentiment Analysis","Reads urgency from tone & keywords"],
            ["🏷️","ML Classification","Assigns correct category"],
            ["🏛️","Auto-Routing","Sends to the right department"],
            ["⏱️","SLA Assignment","Sets resolution deadline"],
          ]},
        ].map(card => (
          <div key={card.title} style={{ background:"#fff", borderRadius:12, border:"1px solid #DDE1E7", padding:"16px 18px", marginBottom:14, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, color:"#111827", marginBottom:12 }}>{card.title}</div>
            {card.content.map(([icon, title, desc]) => (
              <div key={title as string} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{icon as string}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#374151" }}>{title as string}</div>
                  <div style={{ fontSize:11, color:"#9CA3AF" }}>{desc as string}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#B45309", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
            ⏱️ SLA Timelines
          </div>
          {[["🔴 CRITICAL","2 days"],["🟠 HIGH","4 days"],["🟡 MEDIUM","7 days"],["🔵 LOW","14 days"]].map(([p,d]) => (
            <div key={p as string} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 0", borderBottom:"1px solid #FDE68A" }}>
              <span style={{ fontWeight:600, color:"#374151" }}>{p as string}</span>
              <span style={{ fontWeight:700, color:"#B45309" }}>{d as string}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Officer/Admin: All complaints list + status update ────────────────────────
function ManageComplaints() {
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [search, setSearch]         = useState("");
  const [updating, setUpdating]     = useState<number | null>(null);
  const [noteMap, setNoteMap]       = useState<Record<number,string>>({});
  const [statusMap, setStatusMap]   = useState<Record<number,string>>({});

  async function load() {
    setLoading(true);
    try { setComplaints(await getComplaints()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = complaints.filter(c => {
    if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && c.priority !== filterPriority) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function doUpdate(id: number) {
    const newStatus = statusMap[id] as ComplaintStatus;
    if (!newStatus) return;
    setUpdating(id);
    try {
      await updateStatus(id, { status: newStatus, note: noteMap[id] ?? "" });
      await load();
    } finally { setUpdating(null); }
  }

  const inputSm: React.CSSProperties = {
    padding: "7px 10px", background: "#F9FAFB", border: "1.5px solid #DDE1E7",
    borderRadius: 8, fontSize: 12, color: "#111827", outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔎 Search by title…" style={{ ...inputSm, minWidth:200 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputSm}>
          <option value="ALL">All Statuses</option>
          {["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REJECTED"].map(s => (
            <option key={s} value={s}>{s.replace("_"," ")}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={inputSm}>
          <option value="ALL">All Priorities</option>
          {["CRITICAL","HIGH","MEDIUM","LOW"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ marginLeft:"auto", fontSize:12, color:"#6B7280", fontWeight:600, display:"flex", alignItems:"center" }}>
          {filtered.length} complaint(s)
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#9CA3AF" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:"#9CA3AF" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
          No complaints found
        </div>
      ) : (
        filtered.map(c => {
          const validNext = ALLOWED_TRANSITIONS[c.status] ?? [];
          return (
            <div key={c.id} style={{
              background:"#fff", borderRadius:12, border:"1px solid #DDE1E7",
              borderLeft:`4px solid ${c.priority === "CRITICAL" ? "#EF4444" : c.priority === "HIGH" ? "#F97316" : c.priority === "MEDIUM" ? "#F5A623" : "#3B82F6"}`,
              padding:"14px 16px", marginBottom:10,
              boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13.5, color:"#111827", marginBottom:4 }}>
                    #{c.id} — {c.title}
                  </div>
                  <div style={{ fontSize:12, color:"#6B7280", marginBottom:8, lineHeight:1.5 }}>
                    {c.description?.slice(0,120)}{(c.description?.length ?? 0) > 120 ? "…" : ""}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                    {c.department_name && <span style={{ fontSize:10.5, color:"#1D4ED8", fontWeight:700 }}>🏛️ {c.department_name}</span>}
                    {c.urgency_score != null && <span style={{ fontSize:10.5, color:"#DC2626", fontWeight:700 }}>🔥 Urgency: {c.urgency_score}/100</span>}
                  </div>
                </div>

                {/* Update panel */}
                {validNext.length > 0 && (
                  <div style={{
                    background:"#FFFBEB", border:"1.5px solid #FDE68A", borderLeft:"4px solid #F5A623",
                    borderRadius:10, padding:"12px 14px", minWidth:220, flexShrink:0,
                  }}>
                    <div style={{ fontSize:9.5, fontWeight:800, color:"#92400E", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
                      🏛️ Update Status
                    </div>
                    <select
                      value={statusMap[c.id] ?? ""}
                      onChange={e => setStatusMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ ...inputSm, width:"100%", marginBottom:6 }}
                    >
                      <option value="">Choose next status…</option>
                      {validNext.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                    </select>
                    <input
                      placeholder="Add a note (optional)"
                      value={noteMap[c.id] ?? ""}
                      onChange={e => setNoteMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ ...inputSm, width:"100%", marginBottom:8 }}
                    />
                    <button
                      onClick={() => doUpdate(c.id)}
                      disabled={!statusMap[c.id] || updating === c.id}
                      style={{
                        width:"100%", padding:"8px",
                        background: statusMap[c.id] ? "#F5A623" : "#DDE1E7",
                        color: statusMap[c.id] ? "#fff" : "#9CA3AF",
                        border:"none", borderRadius:8,
                        fontSize:12, fontWeight:700, cursor: statusMap[c.id] ? "pointer" : "not-allowed",
                        fontFamily:"'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {updating === c.id ? "Updating…" : "✅ Update"}
                    </button>
                  </div>
                )}
                {validNext.length === 0 && (
                  <div style={{ background:"#F3F4F6", borderRadius:8, padding:"8px 12px", fontSize:11, color:"#6B7280", flexShrink:0 }}>
                    Terminal: {c.status}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ComplaintsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "CITIZEN";
  const isCitizen = role === "CITIZEN";

  return (
    <div>
      <div style={{
        background:"#fff", border:"1px solid #DDE1E7", borderRadius:14,
        padding:"14px 20px", marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, color:"#111827", margin:"0 0 3px" }}>
          {isCitizen ? "📝 File a New Complaint" : "📋 Manage Complaints"}
        </h2>
        <p style={{ fontSize:12, color:"#6B7280", margin:0 }}>
          {isCitizen
            ? "AI automatically classifies urgency, category & routes to the right department."
            : "Review, filter, and update complaint statuses across all departments."}
        </p>
      </div>

      {isCitizen ? <SubmitForm /> : <ManageComplaints />}

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }`}</style>
    </div>
  );
}