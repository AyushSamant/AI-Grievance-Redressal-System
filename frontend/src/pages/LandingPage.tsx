// src/pages/LandingPage.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// ── Particle Text "NivaranAI" ─────────────────────────────────────────────
function ParticleText() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 28;

    // Draw "NivaranAI" on an offscreen canvas to get pixel positions
    const cvs = document.createElement("canvas");
    const SCALE = 4;
    cvs.width  = W * SCALE;
    cvs.height = H * SCALE;
    const ctx = cvs.getContext("2d")!;
    ctx.fillStyle = "#fff";
    const fs = Math.min(W * SCALE * 0.26, 300);
    ctx.font = `900 ${fs}px 'Space Grotesk', sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NivaranAI", cvs.width / 2, cvs.height / 2);

    // Sample pixel positions
    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
    const pts: Array<[number, number]> = [];
    const STEP = 5;
    for (let y = 0; y < cvs.height; y += STEP) {
      for (let x = 0; x < cvs.width; x += STEP) {
        if (imgData[(y * cvs.width + x) * 4 + 3] > 128) {
          pts.push([x, y]);
        }
      }
    }

    const COUNT = Math.min(pts.length, 2800);
    const sampled = pts.sort(() => Math.random() - 0.5).slice(0, COUNT);

    // Convert canvas coords → Three.js world coords
    const aspect = W / H;
    const vFov   = (camera.fov * Math.PI) / 180;
    const height3 = 2 * Math.tan(vFov / 2) * camera.position.z;
    const width3  = height3 * aspect;

    const origins = sampled.map(([px, py]) => new THREE.Vector3(
      (px / cvs.width  - 0.5) * width3,
      -(py / cvs.height - 0.5) * height3,
      0
    ));

    // Current positions — start scattered
    const curPos = origins.map(() => new THREE.Vector3(
      (Math.random() - 0.5) * width3 * 1.4,
      (Math.random() - 0.5) * height3 * 1.4,
      (Math.random() - 0.5) * 10
    ));

    // Build geometry
    const posArr = new Float32Array(COUNT * 3);
    const colArr = new Float32Array(COUNT * 3);

    // Color gradient: gold to warm white
    const goldC  = new THREE.Color("#F5A623");
    const lightC = new THREE.Color("#FAD898");
    const whiteC = new THREE.Color("#FFF8F0");

    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      const c = t < 0.5
        ? goldC.clone().lerp(lightC, t * 2)
        : lightC.clone().lerp(whiteC, (t - 0.5) * 2);
      colArr[i * 3]     = c.r;
      colArr[i * 3 + 1] = c.g;
      colArr[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.44, vertexColors: true,
      transparent: true, opacity: 1.0, sizeAttenuation: true,
    });
    const pts3 = new THREE.Points(geo, mat);
    scene.add(pts3);

    // Mouse in world coords
    const mouse = new THREE.Vector2(9999, 9999);
    const mouse3 = new THREE.Vector3(9999, 9999, 0);
    let hovering = false;

    function onMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / W;
      mouse.y = (e.clientY - rect.top)  / H;
      const nx = (mouse.x - 0.5) * width3;
      const ny = -(mouse.y - 0.5) * height3;
      mouse3.set(nx, ny, 0);
      hovering = true;
    }
    function onMouseLeave() {
      mouse3.set(9999, 9999, 0);
      hovering = false;
    }
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);

    // Velocities
    const vels = Array.from({ length: COUNT }, () => new THREE.Vector3(0, 0, 0));

    let assembled = false;
    let frame = 0;
    let rafId = 0;
    const ASSEMBLE_SPEED = 0.045;
    const REPEL_R = 4.2;
    const REPEL_F = 0.55;
    const RETURN_S = 0.06;

    function animate() {
      rafId = requestAnimationFrame(animate);
      frame++;

      const pos = geo.attributes.position.array as Float32Array;
      let allClose = true;

      for (let i = 0; i < COUNT; i++) {
        const ox = origins[i].x, oy = origins[i].y;
        let px = curPos[i].x,    py = curPos[i].y,  pz = curPos[i].z;

        if (!assembled) {
          // Fly in to origin
          px += (ox - px) * ASSEMBLE_SPEED;
          py += (oy - py) * ASSEMBLE_SPEED;
          pz += (0  - pz) * ASSEMBLE_SPEED;
          if (Math.abs(px - ox) + Math.abs(py - oy) > 0.15) allClose = false;
        } else {
          // Stay at origin with tiny drift + repulsion
          const dx = px - mouse3.x, dy = py - mouse3.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REPEL_R && dist > 0.01) {
            const f = ((REPEL_R - dist) / REPEL_R) * REPEL_F;
            vels[i].x += (dx / dist) * f;
            vels[i].y += (dy / dist) * f;
          }

          // Return to origin
          vels[i].x += (ox - px) * RETURN_S;
          vels[i].y += (oy - py) * RETURN_S;

          // Damping
          vels[i].x *= 0.82;
          vels[i].y *= 0.82;

          // Gentle float
          py += Math.sin(frame * 0.008 + i * 0.05) * 0.003;

          px += vels[i].x;
          py += vels[i].y;
        }

        curPos[i].set(px, py, pz);
        pos[i * 3]     = px;
        pos[i * 3 + 1] = py;
        pos[i * 3 + 2] = pz;
      }

      if (!assembled && allClose && frame > 30) assembled = true;

      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: 200, cursor: "default", pointerEvents: "all" }}
    />
  );
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setV(true); },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}
function Reveal({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

// ── Contact ───────────────────────────────────────────────────────────────
async function sendContact(d: { name: string; email: string; phone: string; message: string }) {
  const r = await fetch("http://localhost:8000/api/contact/", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d),
  });
  if (!r.ok) throw new Error("fail");
}

// ── Data ──────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", emoji: "📝", title: "Citizen Files a Complaint",    desc: "Type or speak your grievance in any language. Our platform accepts Hindi, English, and Hinglish.", color: "#F5A623" },
  { n: "02", emoji: "🤖", title: "AI Analyses Instantly",        desc: "NLP pipeline reads your complaint, scores urgency (0–100), detects sentiment, and sets priority — in under 2 seconds.", color: "#059669" },
  { n: "03", emoji: "🏛️", title: "Auto-Routed to Department",   desc: "ML classifier maps your complaint to 1 of 11 government departments automatically. No manual sorting needed.", color: "#1D4ED8" },
  { n: "04", emoji: "👮", title: "Officer Reviews & Updates",    desc: "The assigned officer sees the complaint in their dashboard and updates status step by step. Every change is logged.", color: "#7C3AED" },
  { n: "05", emoji: "🔍", title: "Citizen Tracks in Real Time",  desc: "Open the Tracking page — see the full timeline, who updated what, and when. Full transparency, zero phone calls.", color: "#B45309" },
];

const FEATURES = [
  { emoji: "⚡", title: "AI Auto-Classification",  desc: "TF-IDF + Random Forest classifies every complaint to the right category in seconds",              color: "#F5A623", bg: "#FFFBEB" },
  { emoji: "🌐", title: "Multilingual Support",    desc: "10+ Indian languages. Hinglish voice input via Web Speech API — no third-party needed",          color: "#059669", bg: "#ECFDF5" },
  { emoji: "📊", title: "Live Analytics Dashboard", desc: "Real-time donut, bar, and line charts for officers and admins using Recharts",                   color: "#1D4ED8", bg: "#EFF6FF" },
  { emoji: "🔐", title: "Role-Based Access",        desc: "Citizens, Officers, and Admins each see only what's relevant to their role",                    color: "#7C3AED", bg: "#F5F3FF" },
  { emoji: "🤖", title: "RAG Policy Chatbot",       desc: "Ask policy questions in plain language — DeepSeek LLM answers from real government documents",   color: "#B45309", bg: "#FEF3DC" },
  { emoji: "🎤", title: "Voice Input",              desc: "Speak your complaint directly in the browser — fully local, no API key, no privacy risk",        color: "#DC2626", bg: "#FEF2F2" },
];

// ── Main Component ────────────────────────────────────────────────────────
export default function LandingPage() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendErr, setSendErr] = useState("");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setSendErr("Please fill name, email and message."); return; }
    setSending(true); setSendErr("");
    try { await sendContact(form); setSent(true); setForm({ name: "", email: "", phone: "", message: "" }); }
    catch { setSendErr("Failed to send. Email us directly: thenivaranai@gmail.com"); }
    finally { setSending(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    background: "#F9FAFB", border: "1.5px solid #DDE1E7",
    borderRadius: 10, fontSize: 14, color: "#111827",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: "none", transition: "border-color 0.15s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F0F2F6", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #F5A623; color: #fff; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn   { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulseDot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @keyframes marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes iconFloat{ 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(3deg)} }
        @keyframes iconFloat2{ 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-9px) rotate(-3deg)} }
        @keyframes iconFloat3{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes countUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmerBg{ 0%{background-position:200% center} 100%{background-position:-200% center} }


        .nav-link {
          cursor: pointer; font-size: 13.5px; font-weight: 600;
          color: #374151; transition: color 0.18s;
        }
        .nav-link:hover { color: #F5A623; }

        .step-card {
          background: #fff; border-radius: 16px;
          border: 1.5px solid #E5E7EB; padding: 26px 24px;
          transition: all 0.25s; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .step-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.10);
          border-color: #FAD898;
        }

        .feat-card {
          background: #fff; border-radius: 14px;
          border: 1.5px solid #E5E7EB; padding: 22px 20px;
          transition: all 0.22s; box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .feat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.09);
          border-color: #FAD898;
        }

        .who-card {
          background: #fff; border-radius: 16px;
          border: 1.5px solid #E5E7EB; padding: 28px 22px;
          text-align: center; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .who-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.10);
          border-color: #FAD898;
        }

        .btn-gold {
          background: #F5A623; color: #fff;
          border: none; border-radius: 10px;
          padding: 12px 28px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.18s;
          font-family: "'Plus Jakarta Sans',sans-serif";
          box-shadow: 0 4px 14px rgba(245,166,35,0.35);
        }
        .btn-gold:hover { background: #E09412; transform: translateY(-2px); box-shadow: 0 8px 22px rgba(245,166,35,0.45); }

        .btn-white {
          background: #fff; color: #374151;
          border: 1.5px solid #DDE1E7; border-radius: 10px;
          padding: 11px 24px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.18s;
          font-family: "'Plus Jakarta Sans',sans-serif";
        }
        .btn-white:hover { border-color: #F5A623; color: #B45309; }

        .contact-inp:focus { border-color: #F5A623 !important; }

        .sec-label {
          font-size: 10.5px; font-weight: 800; color: #92400E;
          letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 10px;
        }
        .sec-h2 {
          font-family: "'Space Grotesk',sans-serif";
          font-size: clamp(24px,3.5vw,38px); font-weight: 800;
          color: #111827; letter-spacing: -0.02em; margin-bottom: 12px;
        }
        .sec-sub { font-size: 15px; color: #6B7280; max-width: 480px; margin: 0 auto; line-height: 1.65; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? "2px solid #F5A623" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.07)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div style={{ width: 38, height: 38, background: "#F5A623", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 3px 10px rgba(245,166,35,0.4)" }}>⚖️</div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#111827" }}>NivaranAI</span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 28 }}>
            {[["How It Works", "how"], ["Features", "features"], ["Who It's For", "who"], ["Contact", "contact"]].map(([l, id]) => (
              <span key={id} className="nav-link" onClick={() => scrollTo(id)}>{l}</span>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-white" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => nav("/login")}>Sign In</button>
            <button className="btn-gold"  style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => nav("/signup")}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "90px 5% 60px", position: "relative", overflow: "hidden",
        background: "linear-gradient(145deg, #FFFBEF 0%, #FEF3DC 45%, #F0F2F6 100%)",
      }}>
        {/* Soft bg circles */}
        <div style={{ position:"absolute", top:"-80px",  right:"-80px",  width:380, height:380, borderRadius:"50%", background:"rgba(245,166,35,0.07)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-100px", left:"-60px", width:320, height:320, borderRadius:"50%", background:"rgba(245,166,35,0.05)", pointerEvents:"none" }}/>



        <div style={{ maxWidth: 760, textAlign: "center", position: "relative", zIndex: 1, width: "100%" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(245,166,35,0.10)", border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: 100, padding: "5px 18px", marginBottom: 28,
            animation: "popIn 0.5s ease both",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F5A623", display: "inline-block", animation: "pulseDot 2s infinite" }}/>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#92400E", letterSpacing: "0.12em", textTransform: "uppercase" }}>AI-Powered Citizen Grievance Platform</span>
          </div>

          {/* Particle text canvas */}
          <div style={{ animation: "fadeUp 0.6s ease 0.05s both" }}>
            <ParticleText />
          </div>

          {/* Tagline */}
          <p style={{
            fontSize: "clamp(14px,2vw,18px)", color: "#6B7280",
            lineHeight: 1.75, maxWidth: 540, margin: "0 auto 36px",
            fontWeight: 500, animation: "fadeUp 0.6s ease 0.2s both",
          }}>
            Smart governance platform where AI reads, classifies, and routes
            citizen complaints to the right government department — automatically.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.6s ease 0.3s both" }}>
            <button className="btn-gold"  style={{ fontSize: 15, padding: "13px 32px" }} onClick={() => nav("/signup")}>🚀 File a Complaint</button>
            <button className="btn-white" style={{ fontSize: 15, padding: "12px 26px" }} onClick={() => scrollTo("how")}>How It Works ↓</button>
          </div>

          {/* Stats strip */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 0, marginTop: 52, flexWrap: "wrap",
            background: "rgba(255,255,255,0.85)", borderRadius: 14,
            border: "1px solid rgba(245,166,35,0.2)",
            padding: "18px 0", maxWidth: 560, marginLeft: "auto", marginRight: "auto",
            animation: "fadeUp 0.6s ease 0.4s both", backdropFilter: "blur(8px)",
          }}>
            {[["11", "Govt Departments"], ["5 sec", "AI Routing"], ["3", "User Roles"], ["2 days", "CRITICAL SLA"]].map(([v, l], i) => (
              <div key={l} style={{ flex: 1, textAlign: "center", padding: "0 16px", borderRight: i < 3 ? "1.5px solid #E5E7EB" : "none" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#F5A623" }}>{v}</div>
                <div style={{ fontSize: 10.5, color: "#9CA3AF", fontWeight: 700, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.07em" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Feature chips */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 22, animation: "fadeUp 0.6s ease 0.5s both" }}>
            {["🤖 AI Classification", "🌐 10+ Languages", "⚡ Auto-Routing", "📊 Live Analytics", "🎤 Voice Input"].map(f => (
              <span key={f} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #FAD898", borderRadius: 100, padding: "4px 14px", fontSize: 12, fontWeight: 600, color: "#B45309" }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPARTMENT MARQUEE ───────────────────────────────────────────── */}
      <div style={{ background:"#fff", borderTop:"1.5px solid #FAD898", borderBottom:"1.5px solid #FAD898", padding:"14px 0", overflow:"hidden", position:"relative" }}>
        {/* fade edges */}
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:80, background:"linear-gradient(to right,#fff,transparent)", zIndex:2, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:80, background:"linear-gradient(to left,#fff,transparent)", zIndex:2, pointerEvents:"none" }}/>

        <div style={{ display:"flex", animation:"marquee 28s linear infinite", width:"max-content" }}>
          {[
            "🏥 Health & Medical",
            "💧 Water Supply",
            "⚡ Electricity & Power",
            "🛣️ Roads & Transport",
            "🏫 Education",
            "🌿 Environment",
            "🏗️ Public Works",
            "🔒 Law & Order",
            "🏠 Housing",
            "🌾 Agriculture",
            "📡 Telecom",
            // repeat for seamless loop
            "🏥 Health & Medical",
            "💧 Water Supply",
            "⚡ Electricity & Power",
            "🛣️ Roads & Transport",
            "🏫 Education",
            "🌿 Environment",
            "🏗️ Public Works",
            "🔒 Law & Order",
            "🏠 Housing",
            "🌾 Agriculture",
            "📡 Telecom",
          ].map((d,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"0 28px", borderRight:"1.5px solid #F3F4F6", whiteSpace:"nowrap" }}>
              <span style={{ fontSize:13.5, fontWeight:600, color:"#6B7280" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how" style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="sec-label">How It Works</div>
            <h2 className="sec-h2">5 Steps. Fully Automated.</h2>
            <p className="sec-sub">From complaint filed to complaint resolved — transparent at every step.</p>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="step-card" style={{ display: "flex", alignItems: "center", gap: 22 }}>
                  {/* Step number */}
                  <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", background: `${s.color}12`, border: `2px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {s.emoji}
                  </div>
                  {/* Step badge */}
                  <div style={{ flexShrink: 0, fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, fontWeight: 800, color: s.color, letterSpacing: "0.1em", minWidth: 42 }}>
                    {s.n}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{s.title}</h3>
                    <p style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                  {/* Connector */}
                  <div style={{ flexShrink: 0, width: 4, height: 40, borderRadius: 2, background: `linear-gradient(to bottom,${s.color},transparent)` }}/>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "80px 5%", background: "#F0F2F6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="sec-label">Platform Features</div>
            <h2 className="sec-h2">Built for India's Citizens 🇮🇳</h2>
            <p className="sec-sub">Every feature designed around real government workflows and real citizen needs.</p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="feat-card">
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 10, background: f.bg, fontSize: 20, marginBottom: 12 }}>
                    {f.emoji}
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</p>
                  <div style={{ marginTop: 14, height: 2, borderRadius: 1, background: `linear-gradient(90deg,${f.color},transparent)` }}/>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section id="who" style={{ padding: "80px 5%", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <div className="sec-label">Who It's For</div>
            <h2 className="sec-h2">Three Roles. One Platform.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
            {[
              { emoji: "👤", role: "Citizens",  desc: "File complaints, track their status in real time, and chat with the AI assistant for policy guidance.", color: "#059669", bg: "#ECFDF5" },
              { emoji: "🏛️", role: "Officers",  desc: "See only your department's complaints. Update status through a defined workflow with one click.", color: "#1D4ED8", bg: "#EFF6FF" },
              { emoji: "🛡️", role: "Admins",    desc: "Full system oversight — assign departments, view analytics, manage all users and complaints.", color: "#7C3AED", bg: "#F5F3FF" },
            ].map((w, i) => (
              <Reveal key={w.role} delay={i * 90}>
                <div className="who-card">
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: w.bg, border: `2px solid ${w.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>
                    {w.emoji}
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{w.role}</h3>
                  <p style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.65, marginBottom: 20 }}>{w.desc}</p>
                  <button className="btn-gold" style={{ fontSize: 13, padding: "9px 22px" }} onClick={() => nav("/signup")}>
                    Get Started →
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: "80px 5%", background: "#F0F2F6" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="sec-label">Contact Us</div>
            <h2 className="sec-h2">Get in Touch</h2>
            <p className="sec-sub">Fill this form — we'll reply within 24 hours. A copy is sent to your email automatically.</p>
          </Reveal>
          <Reveal delay={80}>
            <div style={{ background: "#fff", borderRadius: 18, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Message Sent!</h3>
                  <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 22 }}>Check your inbox — a copy has been sent to your email.</p>
                  <button className="btn-gold" onClick={() => setSent(false)}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleContact}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    {[["Name *", "name", "text", "Your full name"], ["Email *", "email", "email", "your@email.com"]].map(([l, k, t, ph]) => (
                      <div key={k}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{l}</label>
                        <input
                          className="contact-inp" type={t} placeholder={ph}
                          value={(form as any)[k]}
                          onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                          style={inp}
                          onFocus={e => (e.target.style.borderColor = "#F5A623")}
                          onBlur={e  => (e.target.style.borderColor = "#DDE1E7")}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Phone</label>
                    <input className="contact-inp" placeholder="Phone number (optional)" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inp}
                      onFocus={e => (e.target.style.borderColor = "#F5A623")} onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
                    />
                  </div>
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Message *</label>
                    <textarea className="contact-inp" placeholder="How can we help you?" value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      style={{ ...inp, minHeight: 110, resize: "vertical" }}
                      onFocus={e => (e.target.style.borderColor = "#F5A623")} onBlur={e => (e.target.style.borderColor = "#DDE1E7")}
                    />
                  </div>

                  {sendErr && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626", marginBottom: 16 }}>
                      ❌ {sendErr}
                    </div>
                  )}

                  <button type="submit" className="btn-gold" style={{ width: "100%", fontSize: 15, padding: "13px" }} disabled={sending}>
                    {sending ? "Sending…" : "✉️ Send Message"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 12 }}>
                    Or email directly: <span style={{ color: "#F5A623", fontWeight: 700 }}>thenivaranai@gmail.com</span>
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TRUST BANNER ─────────────────────────────────────────────────── */}
      <section style={{ padding:"60px 5%", background:"linear-gradient(135deg,#FFFBEF 0%,#FEF3DC 100%)", borderTop:"2px solid #FAD898" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <Reveal style={{ textAlign:"center", marginBottom:40 }}>
            <div className="sec-label">Why Citizens Trust Us</div>
            <h2 className="sec-h2">Built on Principles of Good Governance</h2>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
            {[
              { icon:"🔒", title:"Secure & Private",      desc:"All data encrypted. JWT authentication. Role-isolated access.", color:"#1D4ED8" },
              { icon:"⚖️", title:"Fair & Transparent",    desc:"Every status change is logged with timestamp and officer name.", color:"#059669" },
              { icon:"⚡", title:"Fast Resolution",        desc:"AI routes complaints in under 5 seconds. SLA enforced automatically.", color:"#F5A623" },
              { icon:"🤝", title:"Accountable Officers",  desc:"Every update is traceable. Officers cannot deny or hide actions.", color:"#7C3AED" },
              { icon:"🇮🇳", title:"Built for India",      desc:"Multilingual, voice-first, designed for every Indian citizen.", color:"#DC2626" },
            ].map((t,i)=>(
              <Reveal key={t.title} delay={i*70}>
                <div style={{ background:"#fff", borderRadius:14, padding:"22px 18px", border:"1.5px solid #FAD898", boxShadow:"0 2px 10px rgba(245,166,35,0.08)", transition:"all 0.22s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow="0 10px 28px rgba(245,166,35,0.14)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow="0 2px 10px rgba(245,166,35,0.08)";}}
                >
                  <div style={{ fontSize:32, marginBottom:10 }}>{t.icon}</div>
                  <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:"#111827", marginBottom:6 }}>{t.title}</h3>
                  <p style={{ fontSize:12.5, color:"#6B7280", lineHeight:1.6 }}>{t.desc}</p>
                  <div style={{ marginTop:12, height:2, borderRadius:1, background:`linear-gradient(90deg,${t.color},transparent)` }}/>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Animated CTA strip */}
          <Reveal delay={200}>
            <div style={{
              marginTop:40, background:"#fff", borderRadius:16,
              border:"2px solid #FAD898", padding:"24px 32px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexWrap:"wrap", gap:16, boxShadow:"0 4px 20px rgba(245,166,35,0.10)",
            }}>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:800, color:"#111827", marginBottom:4 }}>
                  Ready to file your first complaint?
                </div>
                <div style={{ fontSize:13.5, color:"#6B7280" }}>
                  Sign up in 30 seconds. No downloads. No fees. Works on any device.
                </div>
              </div>
              <div style={{ display:"flex", gap:10, flexShrink:0 }}>
                <button className="btn-white" style={{ fontSize:14 }} onClick={()=>nav("/login")}>Sign In</button>
                <button className="btn-gold"  style={{ fontSize:14, padding:"12px 28px" }} onClick={()=>nav("/signup")}>🚀 Get Started Free</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: "28px 5%", background: "#fff", borderTop: "2px solid #F5A623", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#F5A623", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚖️</div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: "#111827", fontSize: 17 }}>NivaranAI</span>
        </div>
        <p style={{ fontSize: 12, color: "#9CA3AF" }}>© 2026 NivaranAI — AI-Powered Citizen Grievance Redressal Platform</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-white" style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => nav("/login")}>Sign In</button>
          <button className="btn-gold"  style={{ padding: "7px 16px", fontSize: 13 }} onClick={() => nav("/signup")}>Sign Up Free</button>
        </div>
      </footer>
    </div>
  );
}