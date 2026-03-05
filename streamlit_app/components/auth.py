import streamlit as st
from components.api import login, get_user_me

def is_authenticated():
    return bool(st.session_state.get("access_token"))

def get_role():
    return st.session_state.get("user_role", "CITIZEN")

def render_login():
    css = """
    <style>
    .login-page { min-height: 80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .login-logo-wrap { width:72px;height:72px;background:#F5A623;border-radius:18px;display:inline-flex;align-items:center;justify-content:center;font-size:2.2rem;margin-bottom:1rem;box-shadow:0 4px 14px rgba(245,166,35,0.4); }
    .login-brand { font-family:'Poppins',sans-serif;font-size:2.4rem;font-weight:800;color:#1A1A2E;margin:0;line-height:1.1; }
    .login-tag   { font-size:0.8rem;color:#718096;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:2rem; }
    .login-card  { background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:2.5rem;box-shadow:0 8px 32px rgba(0,0,0,0.08);min-width:420px; }
    .login-card h3 { font-family:'Poppins',sans-serif;font-size:1.3rem;font-weight:700;color:#1A1A2E;margin-bottom:0.25rem; }
    .login-card p  { font-size:0.83rem;color:#718096;margin-bottom:1.5rem; }
    .login-hint { text-align:center;font-size:0.75rem;color:#A0AEC0;margin-top:1rem; }
    .login-hint code { background:#F4F6F9;padding:2px 6px;border-radius:4px;font-size:0.72rem; }
    </style>
    """
    st.markdown(css, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1.2, 1])
    with col2:
        st.markdown("""
        <div style="text-align:center;padding:2rem 0 0;">
            <div class="login-logo-wrap">⚖️</div><br>
            <div class="login-brand">GrievanceAI</div>
            <div class="login-tag">Smart Governance Platform</div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.markdown("### 🔐 Sign In")
        st.markdown("<p>Access the grievance portal using your registered credentials.</p>", unsafe_allow_html=True)

        with st.form("login_form"):
            username = st.text_input("USERNAME", placeholder="Enter username")
            password = st.text_input("PASSWORD", type="password", placeholder="Enter password")
            submitted = st.form_submit_button("🚀 Login", use_container_width=True, type="primary")

        if submitted:
            if not username or not password:
                st.error("Please enter both username and password.")
            else:
                with st.spinner("Authenticating…"):
                    data, err = login(username, password)
                if err:
                    st.error(f"❌ {err}")
                elif data and "access" in data:
                    st.session_state.access_token  = data["access"]
                    st.session_state.refresh_token = data.get("refresh", "")
                    st.session_state.username      = username
                    # Get real role from backend
                    me, _ = get_user_me()
                    if me and "role" in me:
                        st.session_state.user_role = me["role"]
                        st.session_state.username  = me.get("username", username)
                    else:
                        st.session_state.user_role = "CITIZEN"
                    st.success("✅ Login successful!")
                    st.rerun()
                else:
                    st.error("Invalid credentials.")

        st.markdown('</div>', unsafe_allow_html=True)
        st.markdown("""
        <div class="login-hint">
            Create users via Django Admin or 
            <code>python manage.py createsuperuser</code><br>
            Set role field to: CITIZEN / OFFICER / ADMIN
        </div>
        """, unsafe_allow_html=True)

def logout():
    for k in ["access_token","refresh_token","username","user_role","chat_history"]:
        st.session_state[k] = None
    st.rerun()