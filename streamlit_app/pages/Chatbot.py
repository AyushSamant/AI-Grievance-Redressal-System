import streamlit as st
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from components.auth import is_authenticated
from components.api import ask_chatbot
from components.layout import inject_css, render_sidebar

st.set_page_config(page_title="AI Assistant — GrievanceAI", page_icon="🤖", layout="wide")
inject_css()

if not is_authenticated():
    try: st.switch_page("app.py")
    except: st.error("Please log in."); st.stop()

render_sidebar()

if "chat_history" not in st.session_state or st.session_state.chat_history is None:
    st.session_state.chat_history = []

# ── Header ────────────────────────────────────────────────────────────────────
st.markdown("""
<div style="background:linear-gradient(135deg,#F5A623,#E09415);border-radius:14px;
            padding:1.25rem 1.75rem;margin-bottom:1.25rem;color:#fff;
            box-shadow:0 4px 14px rgba(245,166,35,0.4);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:0.5rem;">
        <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;
                    display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🧠</div>
        <div>
            <div style="font-family:'Poppins',sans-serif;font-size:1.2rem;font-weight:700;">GrievanceAI Assistant</div>
            <div style="font-size:0.72rem;opacity:0.85;">
                <span style="background:rgba(255,255,255,0.2);border-radius:100px;padding:1px 8px;margin-right:6px;">● AI Backend Active</span>
                <span style="background:rgba(255,255,255,0.2);border-radius:100px;padding:1px 8px;">● DeepSeek + RAG</span>
            </div>
        </div>
    </div>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <span style="background:rgba(255,255,255,0.15);border-radius:100px;padding:2px 10px;font-size:0.7rem;">WatsonX Fallback</span>
        <span style="background:rgba(255,255,255,0.15);border-radius:100px;padding:2px 10px;font-size:0.7rem;">Voice Support</span>
        <span style="background:rgba(255,255,255,0.15);border-radius:100px;padding:2px 10px;font-size:0.7rem;">10+ Languages</span>
        <span style="background:rgba(255,255,255,0.15);border-radius:100px;padding:2px 10px;font-size:0.7rem;">RAG Knowledge Base</span>
    </div>
</div>
""", unsafe_allow_html=True)

col_chat, col_side = st.columns([2, 1])

with col_chat:
    # Chat window
    st.markdown("""
    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;
                padding:1.25rem;min-height:420px;margin-bottom:1rem;
                box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    """, unsafe_allow_html=True)

    if not st.session_state.chat_history:
        st.markdown("""
        <div style="text-align:center;padding:2.5rem 1rem;">
            <div style="font-size:2.5rem;margin-bottom:0.75rem;">🤖 🏛️</div>
            <div style="font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;color:#1A1A2E;margin-bottom:0.35rem;">
                Welcome to GrievanceAI
            </div>
            <div style="font-size:0.82rem;color:#718096;margin-bottom:1.5rem;">
                AI system for grievance redressal automation
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;text-align:left;max-width:500px;margin:0 auto;">
                <div style="background:#F4F6F9;border-radius:10px;padding:0.75rem;">
                    <div style="font-size:0.72rem;font-weight:700;color:#F5A623;margin-bottom:3px;">💡 Try saying:</div>
                    <div style="font-size:0.78rem;color:#4A5568;">"Street lights not working in my area"</div>
                </div>
                <div style="background:#F4F6F9;border-radius:10px;padding:0.75rem;">
                    <div style="font-size:0.72rem;font-weight:700;color:#805AD5;margin-bottom:3px;">🔍 Or ask:</div>
                    <div style="font-size:0.78rem;color:#4A5568;">"Water supply problem in locality"</div>
                </div>
                <div style="background:#F4F6F9;border-radius:10px;padding:0.75rem;">
                    <div style="font-size:0.72rem;font-weight:700;color:#2980B9;margin-bottom:3px;">🚦 Traffic issues:</div>
                    <div style="font-size:0.78rem;color:#4A5568;">"Traffic signal not working"</div>
                </div>
                <div style="background:#F4F6F9;border-radius:10px;padding:0.75rem;">
                    <div style="font-size:0.72rem;font-weight:700;color:#27AE60;margin-bottom:3px;">🏥 Healthcare:</div>
                    <div style="font-size:0.78rem;color:#4A5568;">"Hospital services complaint"</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        for msg in st.session_state.chat_history:
            role_cls = "user" if msg["role"] == "user" else "ai"
            avatar   = "👤" if msg["role"] == "user" else "🤖"
            time_str = msg.get("time","")
            align    = "flex-direction:row-reverse;" if msg["role"]=="user" else ""
            bubble_style = (
                "background:#F5A623;color:#fff;border-top-right-radius:3px;"
                if msg["role"]=="user"
                else "background:#F4F6F9;color:#1A1A2E;border:1px solid #E2E8F0;border-top-left-radius:3px;"
            )
            provider = msg.get("provider","")
            provider_tag = (
                f'<div style="font-size:0.62rem;color:#A0AEC0;margin-top:3px;text-align:right;">🤖 {provider}</div>'
                if provider and msg["role"]=="assistant" else ""
            )
            st.markdown(f"""
            <div style="display:flex;{align}gap:10px;margin-bottom:1rem;animation:fadeUp 0.2s ease;">
                <div style="width:32px;height:32px;border-radius:50%;background:#F4F6F9;
                            border:1px solid #E2E8F0;display:flex;align-items:center;
                            justify-content:center;font-size:0.9rem;flex-shrink:0;">{avatar}</div>
                <div style="max-width:75%;">
                    <div style="padding:0.85rem 1rem;border-radius:12px;font-size:0.87rem;
                                line-height:1.6;{bubble_style}">
                        {msg["content"]}
                    </div>
                    <div style="font-size:0.65rem;color:#A0AEC0;margin-top:2px;
                                {'text-align:right;' if msg['role']=='user' else ''}">{time_str}</div>
                    {provider_tag}
                </div>
            </div>
            """, unsafe_allow_html=True)

    st.markdown("</div>", unsafe_allow_html=True)

    # Suggestion chips
    CHIPS = [
        "How long to resolve HIGH priority?",
        "Water supply SLA deadline?",
        "What is the status workflow?",
        "How does AI classify complaints?",
    ]
    chip_cols = st.columns(len(CHIPS))
    for i, (col, chip) in enumerate(zip(chip_cols, CHIPS)):
        with col:
            if st.button(chip, key=f"chip_{i}", use_container_width=True):
                now_str = datetime.now().strftime("%I:%M %p")
                st.session_state.chat_history.append({"role":"user","content":chip,"time":now_str})
                with st.spinner("🤖 Thinking…"):
                    resp, rerr = ask_chatbot(chip)
                answer = resp.get("answer","No response.") if resp else f"Error: {rerr}"
                provider = resp.get("provider","") if resp else ""
                st.session_state.chat_history.append({
                    "role":"assistant","content":answer,"time":datetime.now().strftime("%I:%M %p"),"provider":provider
                })
                st.rerun()

    # Input box
    with st.form("chat_form", clear_on_submit=True):
        c_in, c_btn = st.columns([5,1])
        with c_in:
            user_q = st.text_input("", placeholder="Ask about your complaint, SLA, department contacts…", label_visibility="collapsed")
        with c_btn:
            send = st.form_submit_button("Send 🚀", use_container_width=True, type="primary")

    if send and user_q.strip():
        now_str = datetime.now().strftime("%I:%M %p")
        st.session_state.chat_history.append({"role":"user","content":user_q,"time":now_str})
        with st.spinner("🤖 Thinking…"):
            resp, rerr = ask_chatbot(user_q)
        answer   = resp.get("answer","No response.") if resp else f"Service unavailable: {rerr}"
        provider = resp.get("provider","") if resp else ""
        st.session_state.chat_history.append({
            "role":"assistant","content":answer,
            "time":datetime.now().strftime("%I:%M %p"),"provider":provider
        })
        st.rerun()

with col_side:
    # Clear chat
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.chat_history = []
        st.rerun()

    st.markdown("""
    <div class="info-card" style="margin-top:0.75rem;">
        <div class="ic-label">⚡ AI Capabilities</div>
        <div style="font-size:0.8rem;color:#4A5568;line-height:1.9;">
            🤖 <strong>DeepSeek LLM</strong> — Primary AI<br>
            🔁 <strong>WatsonX</strong> — Fallback<br>
            📚 <strong>RAG</strong> — Knowledge-grounded answers<br>
            🔍 <strong>FAISS</strong> — Semantic search<br>
            🌐 <strong>10+ Languages</strong> — Multilingual
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="info-card">
        <div class="ic-label">💬 Sample Questions</div>
        <div style="font-size:0.78rem;color:#4A5568;line-height:2.0;">
            • How to track my complaint?<br>
            • What is SLA for water issues?<br>
            • Who handles electricity complaints?<br>
            • How is urgency score calculated?<br>
            • What happens after RESOLVED?
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Chat stats
    total_msgs = len(st.session_state.chat_history)
    user_msgs  = len([m for m in st.session_state.chat_history if m["role"]=="user"])
    st.markdown(f"""
    <div class="info-card">
        <div class="ic-label">📊 Session Stats</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.25rem;">
            <div style="text-align:center;background:#F4F6F9;border-radius:8px;padding:0.5rem;">
                <div style="font-family:'Poppins',sans-serif;font-size:1.3rem;font-weight:800;color:#F5A623;">{user_msgs}</div>
                <div style="font-size:0.65rem;color:#718096;">Questions</div>
            </div>
            <div style="text-align:center;background:#F4F6F9;border-radius:8px;padding:0.5rem;">
                <div style="font-family:'Poppins',sans-serif;font-size:1.3rem;font-weight:800;color:#27AE60;">{total_msgs - user_msgs}</div>
                <div style="font-size:0.65rem;color:#718096;">Answers</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)