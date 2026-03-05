"""components/layout.py — Top header navigation + UI helpers"""
import os, streamlit as st
from components.auth import logout
from pathlib import Path

def inject_css():
    BASE_DIR = Path(__file__).resolve().parent.parent  # streamlit_app folder
    css_path = BASE_DIR / "static" / "styles.css"  # if styles.css is in streamlit_app root

    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

def render_top_nav(active="home"):
    """
    Full-width top navigation bar.
    active: 'home' | 'dashboard' | 'complaints' | 'tracking' | 'chatbot'
    """
    role      = st.session_state.get("user_role", "CITIZEN")
    username  = st.session_state.get("username", "User")
    role_icon = {"ADMIN": "🛡️", "OFFICER": "🏛️"}.get(role, "👤")
    role_lbl  = {"ADMIN": "Administrator", "OFFICER": "Officer"}.get(role, "Citizen")

    from datetime import datetime
    now_str = datetime.now().strftime("%a, %d %b %Y")

    # ── Top bar HTML ──────────────────────────────────────────────────────────
    st.markdown(f"""
    <div class="top-nav-bar">
      <div class="tnb-left">
        <div class="tnb-logo">⚖️</div>
        <div>
          <div class="tnb-brand">GrievanceAI</div>
          <div class="tnb-sub">Smart Governance Platform &nbsp;·&nbsp; {now_str}</div>
        </div>
      </div>
      <div class="tnb-right">
        <div class="tnb-status-pill">
          <span class="live-pulse"></span> System Online
        </div>
        <div class="tnb-user-chip">
          <div class="tnb-avatar">{role_icon}</div>
          <div class="tnb-user-info">
            <div class="tnb-uname">{username.title()}</div>
            <div class="tnb-urole">{role_lbl}</div>
          </div>
        </div>
      </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Nav link row (real Streamlit buttons styled as links) ─────────────────
    NAV = [
        ("home",       "app.py",                "🏠 Home"),
        ("dashboard",  "pages/1_Dashboard.py",  "📊 Dashboard"),
        ("complaints", "pages/2_Complaints.py", "📝 Complaints"),
        ("tracking",   "pages/3_Tracking.py",   "🔍 Track Status"),
        ("chatbot",    "pages/4_Chatbot.py",     "🤖 AI Assistant"),
    ]

    # Inject active-nav class for current page button via session state flag
    active_css_override = ""
    for i, (key, _, label) in enumerate(NAV):
        if key == active:
            active_css_override += f"""
            div[data-testid="stHorizontalBlock"] > div:nth-child({i+1}) button {{
                background: #F5A623 !important;
                color: #fff !important;
                border-color: #F5A623 !important;
                font-weight: 700 !important;
                box-shadow: 0 2px 8px rgba(245,166,35,0.35) !important;
            }}
            """
    if active_css_override:
        st.markdown(f"<style>{active_css_override}</style>", unsafe_allow_html=True)

    col_slots = st.columns([1, 1.1, 1.2, 1.2, 1.3, 0.8])

    for i, (key, page, label) in enumerate(NAV):
        with col_slots[i]:
            if st.button(label, key=f"topnav_{key}", use_container_width=True):
                if key != active:
                    try:
                        st.switch_page(page)
                    except Exception:
                        pass

    with col_slots[5]:
        if st.button("🚪 Exit", key="topnav_logout", use_container_width=True):
            logout()

    st.markdown('<div class="nav-divider"></div>', unsafe_allow_html=True)


# ── Helpers ───────────────────────────────────────────────────────────────────
def is_officer_or_admin():
    return st.session_state.get("user_role", "CITIZEN") in ("OFFICER", "ADMIN")


ALLOWED_TRANSITIONS = {
    "SUBMITTED":    ["AI_PROCESSED", "REJECTED"],
    "AI_PROCESSED": ["ASSIGNED",     "REJECTED"],
    "ASSIGNED":     ["IN_PROGRESS",  "REJECTED"],
    "IN_PROGRESS":  ["RESOLVED",     "REJECTED"],
    "RESOLVED":     ["CLOSED"],
    "CLOSED":       [],
    "REJECTED":     [],
}
ALL_STATUSES = list(ALLOWED_TRANSITIONS.keys())

STATUS_CSS = {
    "SUBMITTED":    "status-submitted",
    "AI_PROCESSED": "status-ai",
    "ASSIGNED":     "status-assigned",
    "IN_PROGRESS":  "status-inprogress",
    "RESOLVED":     "status-resolved",
    "CLOSED":       "status-closed",
    "REJECTED":     "status-rejected",
}
PRIORITY_CSS  = {"LOW":"badge-low","MEDIUM":"badge-medium",
                 "HIGH":"badge-high","CRITICAL":"badge-critical"}
PRIORITY_ICON = {"LOW":"🔵","MEDIUM":"🟡","HIGH":"🟠","CRITICAL":"🔴"}


def sbadge(s):
    css   = STATUS_CSS.get(s, "status-submitted")
    label = s.replace("_", " ").title()
    return f'<span class="badge {css}">{label}</span>'


def pbadge(p):
    css  = PRIORITY_CSS.get(p, "badge-medium")
    icon = PRIORITY_ICON.get(p, "●")
    return f'<span class="badge {css}">{icon} {p.title()}</span>'


def kpi(icon, label, value, delta="", color="gold", delta_up=True):
    arrow  = "↑" if delta_up else "↓"
    d_cls  = "delta-up" if delta_up else "delta-down"
    d_html = f'<div class="kpi-delta {d_cls}">{arrow} {delta}</div>' if delta else ""
    return f"""<div class="kpi-card kpi-{color}">
        <div class="kpi-icon kpi-icon-{color}">{icon}</div>
        <div class="kpi-value">{value}</div>
        <div class="kpi-label">{label}</div>
        {d_html}
    </div>"""


def alert(msg, kind="info"):
    icons = {"info":"ℹ️","success":"✅","warning":"⚠️","error":"❌"}
    return f'<div class="alert-box alert-{kind}">{icons.get(kind,"ℹ️")} {msg}</div>'