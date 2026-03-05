import streamlit as st
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import random

from components.auth import is_authenticated
from components.api import get_complaints, get_analytics
from components.layout import inject_css, render_sidebar, is_officer_or_admin, sbadge, pbadge, kpi, alert, ALL_STATUSES

st.set_page_config(page_title="Dashboard — GrievanceAI", page_icon="📊", layout="wide")
inject_css()

if not is_authenticated():
    try: st.switch_page("app.py")
    except: st.error("Please log in."); st.stop()

render_sidebar()

role = st.session_state.get("user_role","CITIZEN")
username = st.session_state.get("username","User")

# ── Page header ───────────────────────────────────────────────────────────────
now = datetime.now()
hdr_title = {"ADMIN":"Government Services Dashboard","OFFICER":"Officer Operations Dashboard"}.get(role,"My Grievance Dashboard")

st.markdown(f"""
<div style="background:linear-gradient(135deg,#FFFBF0,#FEF3DC);border:1px solid #FDDEA0;
            border-radius:14px;padding:1.25rem 1.75rem;margin-bottom:1.25rem;
            display:flex;align-items:center;justify-content:space-between;">
    <div>
        <h2 style="font-family:'Poppins',sans-serif;font-size:1.5rem;font-weight:800;
                   color:#1A1A2E;margin:0 0 4px;">{hdr_title}</h2>
        <p style="color:#B7791F;font-size:0.78rem;margin:0;font-weight:600;">
            Empowering efficient citizen service delivery
        </p>
    </div>
    <div style="text-align:right;">
        <div style="display:inline-flex;align-items:center;gap:6px;background:#E8F8EF;
                    border:1px solid #C6F6D5;border-radius:100px;padding:0.3rem 0.9rem;
                    font-size:0.75rem;font-weight:700;color:#27AE60;">
            ● System Online
        </div>
        <div style="font-size:0.7rem;color:#718096;margin-top:4px;">
            Last updated: {now.strftime("%I:%M:%S %p")}
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# ── Load data ─────────────────────────────────────────────────────────────────
@st.cache_data(ttl=20, show_spinner=False)
def load():
    return get_complaints()

col_r, col_s = st.columns([9,1])
with col_s:
    if st.button("🔄", help="Refresh", use_container_width=True):
        st.cache_data.clear(); st.rerun()

raw, err = load()

# ── Build safe DataFrame ──────────────────────────────────────────────────────
def safe_df(data):
    """Always return a DataFrame regardless of what the API sends back."""
    if not data:
        return pd.DataFrame()
    if isinstance(data, list) and len(data) > 0:
        # List of dicts (normal case)
        if isinstance(data[0], dict):
            return pd.DataFrame(data)
        return pd.DataFrame()
    if isinstance(data, dict):
        # Single object — wrap in list
        return pd.DataFrame([data])
    return pd.DataFrame()

if err:
    st.markdown(alert(f"API unavailable: {err} — showing demo data","warning"), unsafe_allow_html=True)

using_demo = err or not raw
if using_demo:
    DEPTS = ["Health","Infrastructure","Water Supply","Electricity","Sanitation","Agriculture","Public Safety"]
    STATS = ["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED"]
    PRIOS = ["LOW","MEDIUM","HIGH","CRITICAL"]
    CATS  = ["HEALTH","INFRASTRUCTURE","WATER","ELECTRICITY","SANITATION","AGRICULTURE"]
    n = datetime.now()
    raw = [{"id":i,"title":f"Sample Complaint #{i}","status":random.choice(STATS),
            "priority":random.choice(PRIOS),"category":random.choice(CATS),
            "department_name":random.choice(DEPTS),"urgency_score":random.randint(10,95),
            "description":f"Sample issue #{i} description.",
            "created_at":(n-timedelta(days=random.randint(0,60))).isoformat(),
            "updated_at":(n-timedelta(days=random.randint(0,5))).isoformat()}
           for i in range(1,31)]

df = safe_df(raw)
if "created_at" in df.columns:
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
if "updated_at" in df.columns:
    df["updated_at"] = pd.to_datetime(df["updated_at"], errors="coerce")

total    = len(df)
active_s = ["SUBMITTED","AI_PROCESSED","ASSIGNED","IN_PROGRESS"]
active   = len(df[df["status"].isin(active_s)]) if "status" in df.columns else 0
resolved = len(df[df["status"]=="RESOLVED"])    if "status" in df.columns else 0
closed   = len(df[df["status"]=="CLOSED"])      if "status" in df.columns else 0
critical = len(df[df["priority"]=="CRITICAL"])  if "priority" in df.columns else 0
high_p   = len(df[df["priority"]=="HIGH"])      if "priority" in df.columns else 0
res_pct  = round((resolved+closed)/total*100) if total else 0

# ── KPI Cards ─────────────────────────────────────────────────────────────────
k1,k2,k3,k4 = st.columns(4)
with k1: st.markdown(kpi("📋","Total Complaints",total,"12% from last month",True,"gold"), unsafe_allow_html=True)
with k2: st.markdown(kpi("✅","Resolved Today",resolved+closed,"8% from last month",True,"green"), unsafe_allow_html=True)
with k3: st.markdown(kpi("⏳","Pending Review",active,"5% from last month",False,"blue"), unsafe_allow_html=True)
with k4: st.markdown(kpi("🔴","High Priority",critical+high_p,"2% from last month",False,"red"), unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ── Main content: feed + system monitor ──────────────────────────────────────
col_feed, col_monitor = st.columns([1.8, 1])

with col_feed:
    st.markdown(f"""
    <div class="complaint-feed-header">
        <div>
            <div class="feed-title">🔴 Real-time Complaints</div>
            <div class="feed-sub">Live updates • {total} total</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    recent = df.sort_values("created_at", ascending=False).head(8) if "created_at" in df.columns else df.head(8)

    for _, row in recent.iterrows():
        p = str(row.get("priority","MEDIUM"))
        s = str(row.get("status","SUBMITTED"))
        t = str(row.get("title","No Title"))[:55]
        d = str(row.get("description",""))[:80]
        dept = str(row.get("department_name","—") or "—")
        created = row.get("created_at")
        time_str = created.strftime("%I:%M %p") if pd.notna(created) else "—"
        p_cls = p.lower()

        st.markdown(f"""
        <div class="complaint-card {p_cls}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div class="cc-title">{t}</div>
                <div style="font-size:0.7rem;color:#A0AEC0;font-family:monospace;white-space:nowrap;margin-left:8px;">🕐 {time_str}</div>
            </div>
            <div class="cc-desc">{d}</div>
            <div class="cc-meta">
                {pbadge(p)} {sbadge(s)}
                <span class="cc-dept">🏛️ {dept}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

with col_monitor:
    # System Load Monitor
    st.markdown("""
    <div class="monitor-card">
        <div class="monitor-title">📊 System Load Monitor <span style="color:#27AE60;font-size:0.7rem;">● Live</span></div>
        <div class="monitor-grid">
            <div class="mon-item">
                <div class="mon-val" style="color:#2980B9;">1,227</div>
                <div class="mon-key">Active Users</div>
            </div>
            <div class="mon-item">
                <div class="mon-val" style="color:#E53E3E;">7</div>
                <div class="mon-key">Queue Size</div>
            </div>
            <div class="mon-item">
                <div class="mon-val" style="color:#27AE60;">0.7s</div>
                <div class="mon-key">Avg Response</div>
            </div>
            <div class="mon-item">
                <div class="mon-val" style="color:#805AD5;">2</div>
                <div class="mon-key">Processing</div>
            </div>
        </div>
        <div style="font-size:0.72rem;color:#718096;margin-bottom:4px;">System Load: {res_pct}%</div>
        <div style="height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:{res_pct}%;background:linear-gradient(90deg,#27AE60,#F5A623);border-radius:3px;"></div>
        </div>
        <div style="font-size:0.68rem;color:#A0AEC0;margin-top:4px;">Real-time monitoring • Updates every 20s</div>
    </div>
    """.format(res_pct=min(res_pct+45, 95)), unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Quick stats strip
    for label, val, color in [
        ("🟢 Total Resolved", f"{resolved+closed}", "#27AE60"),
        ("🟠 Avg Resolution", "2.3h", "#ED8936"),
        ("🔵 High Priority Pending", f"{critical+high_p}", "#2980B9"),
    ]:
        st.markdown(f"""
        <div style="background:{color};border-radius:10px;padding:0.85rem 1rem;
                    margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#fff;font-size:0.78rem;font-weight:600;">{label}</span>
            <span style="color:#fff;font-family:'Poppins',sans-serif;font-size:1.3rem;font-weight:800;">{val}</span>
        </div>
        """, unsafe_allow_html=True)

# ── Charts (officer/admin only) ────────────────────────────────────────────────
if is_officer_or_admin() and not df.empty:
    st.markdown("<hr style='border-top:2px solid #E2E8F0;margin:1.5rem 0;'>", unsafe_allow_html=True)
    st.markdown("### 📈 Analytics Overview")

    GOLD_PALETTE = ["#F5A623","#27AE60","#2980B9","#E53E3E","#805AD5","#ED8936","#718096"]
    CHART_LAYOUT = dict(
        paper_bgcolor="rgba(255,255,255,1)",
        plot_bgcolor="rgba(248,249,250,1)",
        font=dict(family="Inter",color="#4A5568",size=11),
        margin=dict(l=16,r=16,t=40,b=16),
    )

    ch1, ch2, ch3 = st.columns(3)

    with ch1:
        if "status" in df.columns:
            sc = df["status"].value_counts().reset_index()
            sc.columns = ["status","count"]
            SCOLS = {"SUBMITTED":"#F5A623","AI_PROCESSED":"#805AD5","ASSIGNED":"#F0B73E",
                     "IN_PROGRESS":"#2980B9","RESOLVED":"#27AE60","CLOSED":"#718096","REJECTED":"#E53E3E"}
            fig = go.Figure(go.Pie(
                labels=sc["status"], values=sc["count"], hole=0.55,
                marker=dict(colors=[SCOLS.get(s,"#F5A623") for s in sc["status"]],
                            line=dict(color="#fff",width=2)),
            ))
            fig.add_annotation(text=f"<b>{total}</b><br>Total",
                x=0.5,y=0.5,showarrow=False,font=dict(size=16,color="#1A1A2E"))
            fig.update_layout(**CHART_LAYOUT, height=260,
                title=dict(text="Status Distribution",font=dict(color="#1A1A2E",size=13)),
                legend=dict(font=dict(size=9),bgcolor="rgba(0,0,0,0)"))
            st.plotly_chart(fig, use_container_width=True)

    with ch2:
        dept_col = "department_name"
        if dept_col in df.columns:
            dd = df[df[dept_col].notna()].groupby(dept_col).size().reset_index(name="count").sort_values("count")
            fig2 = go.Figure(go.Bar(
                x=dd["count"], y=dd[dept_col], orientation="h",
                marker=dict(color=GOLD_PALETTE[:len(dd)]),
                text=dd["count"], textposition="outside",
            ))
            fig2.update_layout(**CHART_LAYOUT, height=260,
                title=dict(text="Department Workload",font=dict(color="#1A1A2E",size=13)),
                xaxis=dict(gridcolor="#E2E8F0"),yaxis=dict(gridcolor="#E2E8F0"))
            st.plotly_chart(fig2, use_container_width=True)

    with ch3:
        if "created_at" in df.columns:
            cutoff = datetime.now()-timedelta(days=14)
            td = df[df["created_at"]>=cutoff].copy()
            if not td.empty:
                td["date"] = td["created_at"].dt.date
                tc = td.groupby("date").size().reset_index(name="count")
                fig3 = go.Figure(go.Scatter(
                    x=tc["date"],y=tc["count"],mode="lines+markers",
                    line=dict(color="#F5A623",width=2.5,shape="spline"),
                    marker=dict(color="#F5A623",size=6),
                    fill="tozeroy",fillcolor="rgba(245,166,35,0.1)",
                ))
                fig3.update_layout(**CHART_LAYOUT,height=260,
                    title=dict(text="14-Day Filing Trend",font=dict(color="#1A1A2E",size=13)),
                    xaxis=dict(gridcolor="#E2E8F0"),yaxis=dict(gridcolor="#E2E8F0"),showlegend=False)
                st.plotly_chart(fig3, use_container_width=True)

    # Priority breakdown
    if "priority" in df.columns:
        pc = df["priority"].value_counts().reset_index()
        pc.columns = ["priority","count"]
        PCOLS = {"CRITICAL":"#E53E3E","HIGH":"#ED8936","MEDIUM":"#F5A623","LOW":"#2980B9"}
        fig4 = go.Figure([go.Bar(
            name=r["priority"], x=[r["priority"]], y=[r["count"]],
            marker_color=PCOLS.get(r["priority"],"#F5A623"),
            text=[r["count"]], textposition="outside",
        ) for _,r in pc.iterrows()])
        fig4.update_layout(**CHART_LAYOUT,height=220,
            title=dict(text="Priority Breakdown",font=dict(color="#1A1A2E",size=13)),
            showlegend=False,
            xaxis=dict(gridcolor="#E2E8F0"),yaxis=dict(gridcolor="#E2E8F0"))
        st.plotly_chart(fig4, use_container_width=True)