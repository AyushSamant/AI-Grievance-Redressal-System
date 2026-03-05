import streamlit as st
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
from datetime import datetime

from components.auth import is_authenticated
from components.api import get_complaints, get_complaint, update_status
from components.layout import inject_css, render_sidebar, is_officer_or_admin, sbadge, pbadge, ALLOWED_TRANSITIONS, alert

st.set_page_config(page_title="Track Complaints — GrievanceAI", page_icon="🔍", layout="wide")
inject_css()

if not is_authenticated():
    try: st.switch_page("app.py")
    except: st.error("Please log in."); st.stop()

render_sidebar()
role = st.session_state.get("user_role","CITIZEN")

st.markdown("""
<div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;
            padding:1.1rem 1.5rem;margin-bottom:1.25rem;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    <h2 style="font-family:'Poppins',sans-serif;font-size:1.3rem;font-weight:700;color:#1A1A2E;margin:0 0 3px;">
        🔍 Track Complaint Status
    </h2>
    <p style="font-size:0.77rem;color:#718096;margin:0;">
        Monitor your grievance progress • View full history timeline • AI-powered status updates
    </p>
</div>
""", unsafe_allow_html=True)

# ── Load ──────────────────────────────────────────────────────────────────────
raw, err = get_complaints()
if err:
    st.markdown(alert(f"Failed to load: {err}","error"), unsafe_allow_html=True)
    raw = []
complaints = raw if isinstance(raw, list) else []

if not complaints:
    st.markdown(alert("No complaints found. File one from the Complaints page.","info"), unsafe_allow_html=True)
    st.stop()

# ── Filters ───────────────────────────────────────────────────────────────────
col_f1, col_f2, col_f3 = st.columns([2,1,1])
with col_f1:
    search = st.text_input("🔎 Search by title or ID", placeholder="Type to filter…")
with col_f2:
    from components.layout import ALL_STATUSES
    f_status = st.selectbox("Status", ["All"] + ALL_STATUSES)
with col_f3:
    f_prio = st.selectbox("Priority", ["All","CRITICAL","HIGH","MEDIUM","LOW"])

filtered = complaints
if search:
    filtered = [c for c in filtered if
                search.lower() in str(c.get("title","")).lower() or
                search == str(c.get("id",""))]
if f_status != "All":
    filtered = [c for c in filtered if c.get("status") == f_status]
if f_prio != "All":
    filtered = [c for c in filtered if c.get("priority") == f_prio]

st.markdown(f"<p style='font-size:0.78rem;color:#718096;margin-bottom:0.75rem;'>{len(filtered)} complaint(s) found</p>", unsafe_allow_html=True)

# ── Complaint cards ───────────────────────────────────────────────────────────
for c in filtered:
    cid   = c.get("id","—")
    title = str(c.get("title","No Title"))[:70]
    p     = str(c.get("priority","MEDIUM"))
    s     = str(c.get("status","SUBMITTED"))
    dept  = str(c.get("department_name","—") or "—")
    cat   = str(c.get("category","—") or "—")
    urg   = c.get("urgency_score","—")
    sla   = c.get("sla_days","—")
    desc  = str(c.get("description","") or "")[:200]

    created = c.get("created_at","")
    try: created_str = datetime.fromisoformat(str(created)).strftime("%d %b %Y, %I:%M %p")
    except: created_str = str(created)[:16]

    with st.expander(f"#{cid} — {title}  {s.replace('_',' ').title()}"):
        col_l, col_r = st.columns([1.8, 1.2])

        with col_l:
            # Description
            st.markdown(f"""
            <div style="background:#F4F6F9;border-radius:10px;padding:1rem;margin-bottom:0.75rem;">
                <div style="font-size:0.65rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px;">Description</div>
                <div style="font-size:0.88rem;color:#1A1A2E;line-height:1.6;">{desc or "—"}</div>
            </div>
            """, unsafe_allow_html=True)

            # Details grid
            st.markdown(f"""
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;margin-bottom:0.75rem;">
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:0.6rem 0.75rem;">
                    <div style="font-size:0.62rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;">Category</div>
                    <div style="font-size:0.82rem;font-weight:700;color:#805AD5;">{cat}</div>
                </div>
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:0.6rem 0.75rem;">
                    <div style="font-size:0.62rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;">Department</div>
                    <div style="font-size:0.82rem;font-weight:700;color:#2980B9;">{dept}</div>
                </div>
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:0.6rem 0.75rem;">
                    <div style="font-size:0.62rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;">Submitted</div>
                    <div style="font-size:0.78rem;color:#4A5568;">{created_str}</div>
                </div>
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:0.6rem 0.75rem;">
                    <div style="font-size:0.62rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;">Urgency Score</div>
                    <div style="font-size:0.88rem;font-weight:800;color:#E53E3E;">{urg}/100</div>
                </div>
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:0.6rem 0.75rem;">
                    <div style="font-size:0.62rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;">SLA</div>
                    <div style="font-size:0.88rem;font-weight:700;color:#ED8936;">{sla} days</div>
                </div>
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:0.6rem 0.75rem;">
                    <div style="font-size:0.62rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.09em;">Priority</div>
                    <div>{pbadge(p)}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # Status progress bar
            STATUS_ORDER = ["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED"]
            try:
                progress_idx = STATUS_ORDER.index(s) if s in STATUS_ORDER else 0
            except: progress_idx = 0
            progress_pct = int((progress_idx / (len(STATUS_ORDER)-1)) * 100)
            bar_color = "#27AE60" if s in ("RESOLVED","CLOSED") else "#F5A623"

            st.markdown(f"""
            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:0.85rem 1rem;margin-bottom:0.75rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-size:0.72rem;font-weight:700;color:#4A5568;">Resolution Progress</div>
                    <div style="font-size:0.72rem;color:#A0AEC0;">{progress_pct}%</div>
                </div>
                <div style="height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:{progress_pct}%;background:linear-gradient(90deg,{bar_color},{bar_color}CC);border-radius:4px;transition:width 0.5s;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:5px;">
                    {"".join(f'<span style="font-size:0.58rem;color:{"#F5A623" if i<=progress_idx else "#CBD5E0"};font-weight:{"700" if i==progress_idx else "400"};">{ss.replace("_"," ")}</span>' for i,ss in enumerate(STATUS_ORDER))}
                </div>
            </div>
            """, unsafe_allow_html=True)

        with col_r:
            # History timeline — load full detail
            detail, derr = get_complaint(cid)
            history = []
            if detail and isinstance(detail, dict):
                history = detail.get("history",[]) or []

            st.markdown('<div style="font-size:0.72rem;font-weight:700;color:#4A5568;text-transform:uppercase;letter-spacing:.09em;margin-bottom:0.75rem;">📜 History Timeline</div>', unsafe_allow_html=True)

            if history:
                st.markdown('<div class="timeline">', unsafe_allow_html=True)
                for h in reversed(history):
                    frm = str(h.get("from_status","—"))
                    to  = str(h.get("to_status","—"))
                    actor = str(h.get("actor_username","System"))
                    note  = str(h.get("note","") or "")
                    ts    = h.get("created_at","")
                    try: ts_str = datetime.fromisoformat(str(ts)).strftime("%d %b, %I:%M %p")
                    except: ts_str = str(ts)[:16]
                    dot_cls = "resolved" if to=="RESOLVED" else ("rejected" if to=="REJECTED" else "")
                    st.markdown(f"""
                    <div class="tl-item">
                        <div class="tl-dot {dot_cls}"></div>
                        <div class="tl-content">
                            <div class="tl-date">{ts_str}</div>
                            <div style="display:flex;gap:5px;align-items:center;margin:3px 0;">
                                {sbadge(frm)} <span style="color:#A0AEC0;font-size:0.72rem;">→</span> {sbadge(to)}
                            </div>
                            {f'<div class="tl-note">📝 {note}</div>' if note else ''}
                            <div class="tl-by">👤 by {actor}</div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True)
            else:
                # No history — show visual status step
                st.markdown(f"""
                <div class="timeline">
                    <div class="tl-item">
                        <div class="tl-dot"></div>
                        <div class="tl-content">
                            <div class="tl-date">Submitted</div>
                            <div style="margin:3px 0;">{sbadge("SUBMITTED")}</div>
                            <div class="tl-by">👤 by you</div>
                        </div>
                    </div>
                    <div class="tl-item">
                        <div class="tl-dot" style="background:#E2E8F0;border-color:#E2E8F0;box-shadow:none;"></div>
                        <div class="tl-content" style="opacity:0.5;">
                            <div class="tl-date">Pending AI Processing</div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            # Officer update panel
            if is_officer_or_admin():
                valid = ALLOWED_TRANSITIONS.get(s, [])
                st.markdown('<div class="officer-panel" style="margin-top:0.75rem;">', unsafe_allow_html=True)
                st.markdown('<div class="officer-panel-title">🏛️ Officer Action</div>', unsafe_allow_html=True)
                if valid:
                    with st.form(f"trk_upd_{cid}"):
                        ns   = st.selectbox("Move to", valid, key=f"ns_{cid}")
                        note = st.text_input("Note (optional)", key=f"nt_{cid}")
                        if st.form_submit_button("✅ Update Status", type="primary"):
                            res, uerr = update_status(cid, ns, note)
                            if uerr: st.error(uerr)
                            else:
                                st.success(f"Updated → {ns}")
                                st.rerun()
                else:
                    st.info(f"Terminal state: **{s}**")
                st.markdown('</div>', unsafe_allow_html=True)