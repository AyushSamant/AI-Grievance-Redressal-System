// src/pages/ChatbotPage.tsx
import { useEffect, useRef, useState } from "react";
import { askChatbot } from "../api/chatbot";
import type { ChatMessage } from "../types";
import { format } from "date-fns";

const SUGGESTIONS = [
  "What is the SLA for a HIGH priority complaint?",
  "How does AI classify my complaint?",
  "Which department handles water supply issues?",
  "How to track my complaint status?",
  "What happens after a complaint is RESOLVED?",
  "I have a road pothole problem near my house",
];

// ── Voice hook ────────────────────────────────────────────────────────────────
function useVoice(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const ref = useRef<SpeechRecognition | null>(null);
  const supported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  function toggle() {
    if (!supported) { alert("Voice requires Chrome or Edge."); return; }
    if (listening) { ref.current?.stop(); setListening(false); return; }
    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof SpeechRecognition;
    const r = new SR();
    r.lang = "en-IN"; r.continuous = false; r.interimResults = false;
    r.onresult = e => onResult(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    ref.current = r; r.start(); setListening(true);
  }

  return { toggle, listening, supported };
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { toggle, listening } = useVoice(text => setInput(prev => prev ? `${prev} ${text}` : text));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const now = format(new Date(), "hh:mm a");
    setMessages(prev => [...prev, { role:"user", content:q, time:now }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askChatbot(q);
      setMessages(prev => [...prev, {
        role:"assistant", content: res.answer, time: format(new Date(), "hh:mm a"),
        provider: res.provider,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role:"assistant",
        content:"⚠️ AI service temporarily unavailable. Please ensure the Django backend and FAISS index are running.",
        time: format(new Date(), "hh:mm a"),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#F5A623,#D4891A)",
        borderRadius:14, padding:"18px 22px", marginBottom:20,
        color:"#fff", boxShadow:"0 4px 16px rgba(245,166,35,0.4)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ width:40,height:40,background:"rgba(255,255,255,0.2)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🧠</div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:17,fontWeight:700 }}>NivaranAI Assistant</div>
            <div style={{ fontSize:11,opacity:0.85 }}>
              <span style={{ background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"1px 8px",marginRight:6 }}>● DeepSeek LLM</span>
              <span style={{ background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"1px 8px",marginRight:6 }}>● RAG Knowledge Base</span>
              <span style={{ background:"rgba(255,255,255,0.2)",borderRadius:100,padding:"1px 8px" }}>● Voice Input</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16 }}>
        {/* Chat window */}
        <div>
          {/* Messages */}
          <div style={{
            background:"#fff", border:"1px solid #DDE1E7", borderRadius:14,
            padding:"16px", minHeight:400, maxHeight:520, overflowY:"auto",
            marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🤖 🏛️</div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:"#111827", marginBottom:4 }}>
                  Welcome to NivaranAI 
                </div>
                <div style={{ fontSize:12, color:"#6B7280", marginBottom:20 }}>
                  AI system for grievance redressal automation
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, textAlign:"left" }}>
                  {[
                    ["💡","Try saying:","Street lights not working in my area"],
                    ["🔍","Or ask:","Water supply problem in locality"],
                    ["🚦","Traffic:","Traffic signal not working near me"],
                    ["🏥","Healthcare:","Hospital services complaint"],
                  ].map(([icon,label,ex]) => (
                    <div key={ex as string} style={{ background:"#F9FAFB",borderRadius:8,padding:"10px 12px",cursor:"pointer" }}
                      onClick={() => send(ex as string)}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#F59E0B",marginBottom:2 }}>{icon as string} {label as string}</div>
                      <div style={{ fontSize:11.5,color:"#4B5563" }}>{`"${ex as string}"`}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{
                  display:"flex", flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap:8, marginBottom:14,
                }}>
                  <div style={{
                    width:30,height:30,borderRadius:"50%",flexShrink:0,
                    background: msg.role === "user" ? "#F5A623" : "#F9FAFB",
                    border:"1px solid #DDE1E7",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
                  }}>
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div style={{ maxWidth:"75%" }}>
                    <div style={{
                      padding:"10px 13px", borderRadius:12, fontSize:13.5, lineHeight:1.6,
                      background: msg.role === "user" ? "#F5A623" : "#F9FAFB",
                      color: msg.role === "user" ? "#fff" : "#111827",
                      border: msg.role === "user" ? "none" : "1px solid #DDE1E7",
                      borderTopRightRadius: msg.role === "user" ? 3 : 12,
                      borderTopLeftRadius: msg.role === "assistant" ? 3 : 12,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize:9.5,color:"#9CA3AF",marginTop:3,textAlign: msg.role === "user" ? "right" : "left" }}>
                      {msg.time}{msg.provider ? ` · via ${msg.provider}` : ""}
                    </div>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <div style={{ width:30,height:30,borderRadius:"50%",background:"#F9FAFB",border:"1px solid #DDE1E7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>🤖</div>
                <div style={{ background:"#F9FAFB",border:"1px solid #DDE1E7",borderRadius:12,borderTopLeftRadius:3,padding:"10px 14px" }}>
                  <span style={{ display:"flex",gap:4 }}>
                    {[0,1,2].map(i => <span key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#F5A623",animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {SUGGESTIONS.slice(0,4).map(s => (
              <button key={s} onClick={() => send(s)} style={{
                background:"#F9FAFB", border:"1px solid #DDE1E7", borderRadius:100,
                padding:"5px 12px", fontSize:11, fontWeight:600, color:"#374151",
                cursor:"pointer", transition:"all 0.15s",
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor="#F5A623"; (e.target as HTMLButtonElement).style.color="#B45309"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor="#DDE1E7"; (e.target as HTMLButtonElement).style.color="#374151"; }}
              >
                {s.length > 38 ? s.slice(0,38)+"…" : s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display:"flex", gap:8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your complaint, SLA, department contacts…"
              style={{
                flex:1, padding:"12px 16px",
                background:"#fff", border:"1.5px solid #DDE1E7", borderRadius:10,
                fontSize:13.5, color:"#111827", outline:"none",
                fontFamily:"'Plus Jakarta Sans', sans-serif",
              }}
              onFocus={e => (e.target.style.borderColor = "#F5A623")}
              onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
            />
            {/* Voice */}
            <button onClick={toggle} style={{
              padding:"0 14px", borderRadius:10,
              background: listening ? "#FEF2F2" : "#FFFBEB",
              border: `1.5px solid ${listening ? "#FECACA" : "#FDE68A"}`,
              color: listening ? "#DC2626" : "#B45309",
              cursor:"pointer", fontSize:16,
            }}>
              {listening ? "⏹️" : "🎤"}
            </button>
            {/* Send */}
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                padding:"0 18px", borderRadius:10,
                background: input.trim() ? "#F5A623" : "#DDE1E7",
                color: input.trim() ? "#fff" : "#9CA3AF",
                border:"none", cursor: input.trim() ? "pointer" : "not-allowed",
                fontSize:13, fontWeight:700,
                boxShadow: input.trim() ? "0 2px 8px rgba(245,166,35,0.3)" : "none",
                fontFamily:"'Plus Jakarta Sans', sans-serif",
              }}
            >
              Send 🚀
            </button>
          </div>
        </div>

        {/* Side panel */}
        <div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{
              width:"100%",marginBottom:12,padding:"8px",
              background:"#FEF2F2",border:"1px solid #FECACA",
              borderRadius:8,color:"#DC2626",fontSize:12,fontWeight:700,cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans', sans-serif",
            }}>
              🗑️ Clear Chat
            </button>
          )}

          <div style={{ background:"#fff",border:"1px solid #DDE1E7",borderRadius:12,padding:"14px 16px",marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>⚡ AI Capabilities</div>
            {[["🤖","DeepSeek LLM","Primary AI engine"],["🔁","WatsonX","Fallback provider"],["📚","RAG","Knowledge-grounded answers"],["🔍","FAISS","Semantic policy search"],["🎤","Voice","Web Speech API"]].map(([i,t,d]) => (
              <div key={t as string} style={{ display:"flex",alignItems:"flex-start",gap:8,marginBottom:9 }}>
                <span style={{ fontSize:16,flexShrink:0 }}>{i as string}</span>
                <div>
                  <div style={{ fontSize:11.5,fontWeight:700,color:"#374151" }}>{t as string}</div>
                  <div style={{ fontSize:10.5,color:"#9CA3AF" }}>{d as string}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff",border:"1px solid #DDE1E7",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>📊 Session</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {[["Questions",messages.filter(m=>m.role==="user").length,"#F5A623"],["Answers",messages.filter(m=>m.role==="assistant").length,"#059669"]].map(([l,v,c]) => (
                <div key={l as string} style={{ background:"#F9FAFB",borderRadius:8,padding:"10px",textAlign:"center" }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif",fontSize:22,fontWeight:800,color:c as string }}>{v as number}</div>
                  <div style={{ fontSize:10.5,color:"#9CA3AF" }}>{l as string}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}