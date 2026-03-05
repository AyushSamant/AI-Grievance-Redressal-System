// src/pages/HomePage.tsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const CITIZEN_CARDS = [
  { icon:"📊", title:"Dashboard",     desc:"Track your complaints & history",  to:"/dashboard",  accent:"#F5A623" },
  { icon:"📝", title:"File Complaint",desc:"Submit a new grievance via AI",     to:"/complaints", accent:"#059669" },
  { icon:"🔍", title:"Track Status",  desc:"Follow your complaint timeline",   to:"/tracking",   accent:"#1D4ED8" },
  { icon:"🤖", title:"AI Assistant",  desc:"Chat with DeepSeek AI",             to:"/chatbot",    accent:"#7C3AED" },
];
const OFFICER_CARDS = [
  { icon:"🏛️", title:"My Department",desc:"View & update assigned complaints", to:"/officer",    accent:"#7C3AED" },
  { icon:"📊", title:"Dashboard",     desc:"Department analytics & KPIs",      to:"/dashboard",  accent:"#F5A623" },
  { icon:"🔍", title:"All Cases",     desc:"Browse all department complaints",  to:"/tracking",   accent:"#1D4ED8" },
  { icon:"🤖", title:"AI Assistant",  desc:"Policy & procedure queries",        to:"/chatbot",    accent:"#059669" },
];
const ADMIN_CARDS = [
  { icon:"🛡️", title:"Admin Panel",  desc:"Full analytics & oversight",       to:"/admin",      accent:"#EF4444" },
  { icon:"📊", title:"Dashboard",     desc:"System-wide KPIs & trends",        to:"/dashboard",  accent:"#F5A623" },
  { icon:"📝", title:"All Complaints",desc:"Manage every complaint",            to:"/complaints", accent:"#059669" },
  { icon:"🤖", title:"AI Assistant",  desc:"Intelligent query resolution",     to:"/chatbot",    accent:"#7C3AED" },
];

const ROLE_META: Record<string, { icon: string; subtitle: string; cards: typeof CITIZEN_CARDS; color: string; bg: string }> = {
  CITIZEN: { icon:"👤", subtitle:"File and track your grievances below.",              cards:CITIZEN_CARDS, color:"#059669", bg:"#ECFDF5" },
  OFFICER: { icon:"🏛️", subtitle:"Review your department's complaints and update statuses.", cards:OFFICER_CARDS, color:"#7C3AED", bg:"#F5F3FF" },
  ADMIN:   { icon:"🛡️", subtitle:"Full system oversight — analytics, users, departments.",   cards:ADMIN_CARDS,   color:"#DC2626", bg:"#FEF2F2" },
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const role      = user?.role ?? "CITIZEN";
  const meta      = ROLE_META[role] ?? ROLE_META.CITIZEN;

  // Use actual username — fallback to role name only if username missing
  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <div>
      {/* Hero */}
      <div style={{
        background:"linear-gradient(135deg,#FFFBEF 0%,#FEF3DC 100%)",
        border:"1px solid #FAD898", borderRadius:16,
        padding:"32px 36px", marginBottom:28,
        boxShadow:"0 2px 12px rgba(245,166,35,0.12)",
      }}>
        <div style={{fontSize:10,fontWeight:800,color:"#92400E",textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:8}}>
          ⚖️ NivaranAI · Smart Governance
        </div>
        <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:28,fontWeight:800,color:"#111827",margin:"0 0 8px"}}>
          Welcome, {displayName} {meta.icon}
        </h1>
        <p style={{fontSize:14,color:"#6B7280",margin:"0 0 8px"}}>{meta.subtitle}</p>

        {/* Role badge */}
        <span style={{
          display:"inline-block", background:meta.bg, color:meta.color,
          borderRadius:100, padding:"4px 14px", fontSize:11, fontWeight:800,
          letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:16,
        }}>
          {role}
        </span>

        {/* Feature chips */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["🤖 AI Classification","🌐 10+ Languages","⚡ Auto-Routing","📊 Live Analytics","🔐 Role-Based Access"].map(f=>(
            <span key={f} style={{
              background:"rgba(255,255,255,0.8)", border:"1px solid #FAD898",
              borderRadius:100, padding:"4px 12px", fontSize:11.5, fontWeight:600, color:"#B45309",
            }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        {meta.cards.map(card=>(
          <button
            key={card.to}
            onClick={()=>navigate(card.to)}
            style={{
              background:"#fff", border:`2px solid ${card.accent}22`,
              borderRadius:16, padding:"22px 20px", textAlign:"left",
              cursor:"pointer", transition:"all 0.18s",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              fontFamily:"'Plus Jakarta Sans',sans-serif",
            }}
            onMouseEnter={e=>{
              (e.currentTarget as HTMLElement).style.transform="translateY(-3px)";
              (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${card.accent}30`;
              (e.currentTarget as HTMLElement).style.borderColor=`${card.accent}66`;
            }}
            onMouseLeave={e=>{
              (e.currentTarget as HTMLElement).style.transform="translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow="0 2px 8px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor=`${card.accent}22`;
            }}
          >
            <div style={{fontSize:32,marginBottom:12}}>{card.icon}</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:15,fontWeight:700,color:"#111827",marginBottom:4}}>
              {card.title}
            </div>
            <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{card.desc}</div>
            <div style={{marginTop:14,fontSize:11,fontWeight:700,color:card.accent}}>Open →</div>
          </button>
        ))}
      </div>
    </div>
  );
}