import streamlit as st
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from components.auth import is_authenticated
from components.api import create_complaint, get_complaints
from components.layout import inject_css, render_sidebar, is_officer_or_admin, sbadge, pbadge, alert

st.set_page_config(page_title="Complaints — GrievanceAI", page_icon="📝", layout="wide")
inject_css()

if not is_authenticated():
    try: st.switch_page("app.py")
    except: st.error("Please log in."); st.stop()

render_sidebar()
role = st.session_state.get("user_role","CITIZEN")

# ── Page header ───────────────────────────────────────────────────────────────
st.markdown("""
<div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;
            padding:1.1rem 1.5rem;margin-bottom:1.25rem;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    <h2 style="font-family:'Poppins',sans-serif;font-size:1.3rem;font-weight:700;
               color:#1A1A2E;margin:0 0 3px;">📝 Complaints</h2>
    <p style="font-size:0.77rem;color:#718096;margin:0;">
        Submit a grievance • AI auto-classifies urgency, category & routes to department
    </p>
</div>
""", unsafe_allow_html=True)

# For OFFICER/ADMIN: show all complaints list + status update
# For CITIZEN: show submission form

if is_officer_or_admin():
    # Officer view — all complaints with status update
    st.markdown("### 📋 All Complaints")

    from components.api import get_complaints, update_status
    import pandas as pd

    raw, err = get_complaints()
    if err:
        st.markdown(alert(f"Failed to load: {err}","error"), unsafe_allow_html=True)
    else:
        complaints = raw if isinstance(raw, list) else []

        # Filters
        fc1, fc2, fc3 = st.columns(3)
        with fc1:
            from components.layout import ALL_STATUSES
            f_status = st.multiselect("Filter Status", ALL_STATUSES, default=[])
        with fc2:
            f_prio = st.multiselect("Filter Priority", ["CRITICAL","HIGH","MEDIUM","LOW"], default=[])
        with fc3:
            f_search = st.text_input("Search", placeholder="Keyword in title…")

        filtered = complaints
        if f_status: filtered = [c for c in filtered if c.get("status") in f_status]
        if f_prio:   filtered = [c for c in filtered if c.get("priority") in f_prio]
        if f_search: filtered = [c for c in filtered if f_search.lower() in str(c.get("title","")).lower()]

        st.markdown(f"**{len(filtered)}** complaint(s) found")

        for c in filtered:
            with st.expander(f"#{c.get('id')} — {str(c.get('title',''))[:60]}"):
                col_d, col_a = st.columns([2,1])
                with col_d:
                    st.markdown(f"""
                    <div style="background:#F4F6F9;border-radius:10px;padding:1rem;">
                        <div style="font-size:0.68rem;color:#A0AEC0;text-transform:uppercase;letter-spacing:.08em;">Description</div>
                        <div style="font-size:0.88rem;color:#1A1A2E;margin-top:4px;">{c.get("description","—")}</div>
                        <div style="margin-top:0.75rem;display:flex;gap:8px;flex-wrap:wrap;">
                            {pbadge(c.get("priority","MEDIUM"))} {sbadge(c.get("status","SUBMITTED"))}
                            <span style="font-size:0.72rem;color:#2980B9;font-weight:600;">🏛️ {c.get("department_name","—") or "—"}</span>
                            <span style="font-size:0.72rem;color:#805AD5;font-weight:600;">🤖 {c.get("category","—") or "—"}</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                with col_a:
                    from components.layout import ALLOWED_TRANSITIONS
                    curr = c.get("status","SUBMITTED")
                    valid = ALLOWED_TRANSITIONS.get(curr, [])
                    st.markdown('<div class="officer-panel">', unsafe_allow_html=True)
                    st.markdown('<div class="officer-panel-title">🏛️ Update Status</div>', unsafe_allow_html=True)
                    if valid:
                        with st.form(f"upd_{c.get('id')}"):
                            ns = st.selectbox("New Status", valid)
                            note = st.text_input("Note")
                            if st.form_submit_button("✅ Update", type="primary"):
                                res, uerr = update_status(c.get("id"), ns, note)
                                if uerr:
                                    st.error(uerr)
                                else:
                                    st.success(f"{curr} → {ns}")
                                    st.rerun()
                    else:
                        st.info(f"Terminal: {curr}")
                    st.markdown('</div>', unsafe_allow_html=True)

else:
    # ── CITIZEN VIEW — Submit form ─────────────────────────────────────────────
    col_form, col_side = st.columns([1.6, 1])

    with col_form:
        st.markdown("""
        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;
                    padding:1.5rem;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <div style="font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;
                        color:#1A1A2E;margin-bottom:0.25rem;">📤 Submit New Complaint</div>
            <div style="font-size:0.75rem;color:#718096;margin-bottom:1.25rem;">
                AI-powered analysis with automatic department routing
            </div>
        </div>
        """, unsafe_allow_html=True)

        with st.form("complaint_form"):
            title = st.text_input("Complaint Title *",
                placeholder="e.g. No water supply in Sector 12 since 3 days",
                max_chars=200)
            description = st.text_area("Detailed Description *",
                placeholder="Describe what happened, where, since when, who is affected…\nThe AI uses this to determine urgency and department.",
                height=150)
            channel = st.selectbox("Input Channel", ["TEXT","VOICE"],
                help="TEXT for written · VOICE if you recorded an audio note")

            st.markdown("""
            <div class="alert-box alert-info" style="margin-top:0.5rem;">
                🤖 Priority, category & department are set automatically by AI — no need to select.
            </div>
            """, unsafe_allow_html=True)

            submitted = st.form_submit_button("🤖 Analyze & Submit", use_container_width=True, type="primary")

        if submitted:
            errs = []
            if not title.strip(): errs.append("Title is required.")
            if len(description.strip()) < 20: errs.append("Description must be at least 20 characters.")
            if errs:
                for e in errs: st.markdown(alert(e,"error"), unsafe_allow_html=True)
            else:
                with st.spinner("🤖 AI is analyzing your complaint…"):
                    data, err = create_complaint(title.strip(), description.strip(), channel)

                if err:
                    st.markdown(alert(f"Submission failed: {err}","error"), unsafe_allow_html=True)
                else:
                    cid         = data.get("id","—") if data else "—"
                    ai_priority = data.get("priority","—") if data else "—"
                    ai_category = data.get("category","—") if data else "—"
                    ai_dept     = data.get("department_name","—") if data else "—"
                    ai_sla      = data.get("sla_days","—") if data else "—"
                    ai_urgency  = data.get("urgency_score","—") if data else "—"
                    ai_sentiment= data.get("sentiment","—") if data else "—"
                    ai_status   = data.get("status","SUBMITTED") if data else "SUBMITTED"

                    st.success(f"✅ Complaint #{cid} submitted successfully!")

                    # AI Analysis Results panel (like Samadhan AI)
                    st.markdown(f"""
                    <div class="ai-result">
                        <div class="ai-result-title">✨ AI Analysis Results</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
                            <div>
                                <div style="font-size:0.68rem;color:#718096;text-transform:uppercase;letter-spacing:.07em;">Category</div>
                                <div style="font-weight:700;color:#805AD5;">{ai_category}</div>
                            </div>
                            <div>
                                <div style="font-size:0.68rem;color:#718096;text-transform:uppercase;letter-spacing:.07em;">Priority</div>
                                <div>{pbadge(ai_priority) if ai_priority != "—" else "—"}</div>
                            </div>
                            <div>
                                <div style="font-size:0.68rem;color:#718096;text-transform:uppercase;letter-spacing:.07em;">Department</div>
                                <div style="font-weight:600;color:#2980B9;">{ai_dept}</div>
                            </div>
                            <div>
                                <div style="font-size:0.68rem;color:#718096;text-transform:uppercase;letter-spacing:.07em;">Sentiment</div>
                                <div style="color:#4A5568;">{ai_sentiment}</div>
                            </div>
                            <div>
                                <div style="font-size:0.68rem;color:#718096;text-transform:uppercase;letter-spacing:.07em;">SLA</div>
                                <div style="color:#ED8936;font-weight:700;">{ai_sla} days</div>
                            </div>
                            <div>
                                <div style="font-size:0.68rem;color:#718096;text-transform:uppercase;letter-spacing:.07em;">Urgency Score</div>
                                <div style="color:#E53E3E;font-weight:700;">{ai_urgency}/100</div>
                            </div>
                        </div>
                        <div style="background:#fff;border:1px solid #E9D8FD;border-radius:8px;padding:0.75rem;">
                            <div style="font-size:0.72rem;color:#805AD5;font-weight:700;margin-bottom:4px;">🤖 AI Response:</div>
                            <div style="font-size:0.82rem;color:#4A5568;line-height:1.6;">
                                Your complaint has been categorized as a <strong>{ai_category}</strong> issue and 
                                routed to the <strong>{ai_dept}</strong> department. 
                                Expected resolution within <strong>{ai_sla} days</strong>.
                                Track your complaint using ID <strong>#{cid}</strong>.
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

    with col_side:
        st.markdown("""
        <div class="info-card">
            <div class="ic-label">🤖 How AI Works</div>
            <div class="ic-value" style="font-size:0.82rem;line-height:1.8;">
                <strong style="color:#F5A623;">1. Language Detection</strong> — Identifies your language<br>
                <strong style="color:#805AD5;">2. Sentiment Analysis</strong> — Reads urgency/tone<br>
                <strong style="color:#27AE60;">3. ML Classification</strong> — Assigns category<br>
                <strong style="color:#2980B9;">4. Auto-Routing</strong> — Sends to department<br>
                <strong style="color:#ED8936;">5. SLA Assignment</strong> — Sets deadline
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("""
        <div class="info-card" style="border-left:3px solid #F5A623;">
            <div class="ic-label">⏱️ SLA Timelines</div>
            <div class="ic-value" style="font-size:0.82rem;line-height:1.9;">
                🔴 <strong>CRITICAL</strong> — 2 days<br>
                🟠 <strong>HIGH</strong> — 4 days<br>
                🟡 <strong>MEDIUM</strong> — 7 days<br>
                🔵 <strong>LOW</strong> — 14 days
            </div>
        </div>
        """, unsafe_allow_html=True)

        # My recent complaints
        st.markdown("#### My Recent Complaints")
        raw2, _ = get_complaints()
        if raw2 and isinstance(raw2, list):
            for c in raw2[:4]:
                st.markdown(f"""
                <div style="background:#F4F6F9;border-radius:8px;padding:0.65rem 0.85rem;margin-bottom:6px;
                            border-left:3px solid #F5A623;">
                    <div style="font-size:0.8rem;font-weight:600;color:#1A1A2E;">{str(c.get("title",""))[:40]}</div>
                    <div style="margin-top:3px;display:flex;gap:5px;">
                        {pbadge(c.get("priority","MEDIUM"))} {sbadge(c.get("status","SUBMITTED"))}
                    </div>
                </div>
                """, unsafe_allow_html=True)