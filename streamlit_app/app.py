import streamlit as st
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from components.auth import render_login, is_authenticated
from components.layout import inject_css, render_top_nav

st.set_page_config(
    page_title="GrievanceAI",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

for k, v in [("access_token",None),("user_role","CITIZEN"),("username",""),
             ("refresh_token",None),("chat_history",[])]:
    if k not in st.session_state:
        st.session_state[k] = v

inject_css()

if not is_authenticated():
    render_login()
    st.stop()

render_top_nav(active="home")

role     = st.session_state.get("user_role","CITIZEN")
username = st.session_state.get("username","User")

# ── Welcome banner ────────────────────────────────────────────────────────────
st.markdown(f"""
<div style="background:linear-gradient(135deg,#FFFBEF 0%,#FEF3DC 100%);
            border:1px solid #FAD898;border-radius:16px;padding:2rem 2.5rem;
            margin-bottom:1.5rem;box-shadow:0 2px 8px rgba(245,166,35,0.12);">
  <div style="font-size:0.68rem;color:#92400E;font-weight:700;text-transform:uppercase;
              letter-spacing:0.12em;margin-bottom:0.5rem;">
    ⚖️ Welcome to GrievanceAI
  </div>
  <h1 style="font-family:'Poppins',sans-serif;font-size:1.9rem;font-weight:800;
             color:#111827;margin:0 0 0.4rem;">
    Hello, {username.title()} 👋
  </h1>
  <p style="color:#6B7280;font-size:0.88rem;margin:0;">
    AI-powered citizen grievance redressal system &nbsp;·&nbsp; 
    Role: <strong style="color:#D4891A;">{role}</strong> &nbsp;·&nbsp; 
    <span style="color:#059669;font-weight:600;">● System Online</span>
  </p>
</div>
""", unsafe_allow_html=True)

# ── Quick navigation cards ────────────────────────────────────────────────────
c1, c2, c3, c4 = st.columns(4)
CARDS = [
    (c1,"📊","Dashboard","Live KPIs & complaint feed","pages/1_Dashboard.py","#F5A623"),
    (c2,"📝","File Complaint","Submit a new grievance","pages/2_Complaints.py","#059669"),
    (c3,"🔍","Track Status","Monitor complaint timeline","pages/3_Tracking.py","#1D4ED8"),
    (c4,"🤖","AI Assistant","Chat with DeepSeek AI","pages/4_Chatbot.py","#7C3AED"),
]
for col, icon, title, desc, page, accent in CARDS:
    with col:
        st.markdown(f"""
        <div style="background:#fff;border:1.5px solid #DDE1E7;border-radius:14px;
                    padding:1.5rem 1rem 1rem;text-align:center;
                    border-top:4px solid {accent};box-shadow:0 1px 4px rgba(0,0,0,0.06);
                    margin-bottom:4px;">
          <div style="font-size:2.2rem;margin-bottom:0.6rem;">{icon}</div>
          <div style="font-family:'Poppins',sans-serif;font-weight:700;font-size:0.95rem;
                      color:#111827;margin-bottom:0.3rem;">{title}</div>
          <div style="font-size:0.73rem;color:#6B7280;">{desc}</div>
        </div>
        """, unsafe_allow_html=True)
        if st.button(f"Open →", key=f"card_{title}", use_container_width=True, type="primary"):
            try:
                st.switch_page(page)
            except Exception:
                st.info(f"Click **{title}** in the top nav bar above.")

# ── Feature strip ─────────────────────────────────────────────────────────────
st.markdown("<br>", unsafe_allow_html=True)
f1,f2,f3,f4 = st.columns(4)
FEATURES = [
    (f1,"🤖","AI Classification","Auto-categorizes every complaint using ML"),
    (f2,"🌐","Multilingual","Voice + text in 10+ languages via Whisper"),
    (f3,"⚡","Smart Routing","Auto-assigns to the right department"),
    (f4,"📊","Live Analytics","DeepSeek LLM + RAG knowledge base"),
]
for col, icon, title, desc in FEATURES:
    with col:
        st.markdown(f"""
        <div style="background:#fff;border:1px solid #DDE1E7;border-radius:10px;
                    padding:1rem;display:flex;align-items:flex-start;gap:10px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <span style="font-size:1.4rem;flex-shrink:0;">{icon}</span>
          <div>
            <div style="font-size:0.8rem;font-weight:700;color:#111827;">{title}</div>
            <div style="font-size:0.7rem;color:#6B7280;margin-top:2px;">{desc}</div>
          </div>
        </div>
        """, unsafe_allow_html=True)