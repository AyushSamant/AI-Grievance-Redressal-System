"""
components/api.py
─────────────────
FIX: Handles both list [] and paginated {"results":[]} API responses.
     DataFrame crash fixed by always returning a list.
"""
import requests
import streamlit as st

BASE_URL = "http://127.0.0.1:8000"

def _headers():
    token = st.session_state.get("access_token")
    if not token:
        return {"Content-Type": "application/json"}
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

def _handle(resp):
    if resp.status_code == 401:
        for k in ["access_token","user_role","username"]:
            st.session_state[k] = None
        return None, "Session expired. Please log in again."
    if resp.status_code in (200, 201):
        try:
            return resp.json(), None
        except Exception:
            return {}, None
    try:
        detail = resp.json().get("detail", resp.text)
    except Exception:
        detail = resp.text
    return None, f"Error {resp.status_code}: {detail}"

def login(username, password):
    try:
        r = requests.post(f"{BASE_URL}/api/token/",
            json={"username": username, "password": password},
            headers={"Content-Type":"application/json","Accept":"application/json"},
            timeout=10)
        return _handle(r)
    except requests.exceptions.ConnectionError:
        return None, "Cannot connect to Django. Is it running on port 8000?"
    except Exception as e:
        return None, str(e)

def get_user_me():
    try:
        r = requests.get(f"{BASE_URL}/api/users/me/", headers=_headers(), timeout=10)
        return _handle(r)
    except Exception as e:
        return None, str(e)

def get_complaints():
    """Returns always a LIST, handles paginated or plain responses."""
    try:
        r = requests.get(f"{BASE_URL}/api/complaints/", headers=_headers(), timeout=10)
        data, err = _handle(r)
        if err:
            return None, err
        # Handle DRF pagination: {"count":N,"results":[...]}
        if isinstance(data, dict) and "results" in data:
            return data["results"], None
        if isinstance(data, list):
            return data, None
        # Single object returned — wrap in list
        if isinstance(data, dict):
            return [data], None
        return [], None
    except requests.exceptions.ConnectionError:
        return None, "Cannot connect to server."
    except Exception as e:
        return None, str(e)

def get_complaint(cid):
    try:
        r = requests.get(f"{BASE_URL}/api/complaints/{cid}/", headers=_headers(), timeout=10)
        return _handle(r)
    except Exception as e:
        return None, str(e)

def create_complaint(title, description, channel="TEXT"):
    """POST /api/complaints/ — only title/description/channel. AI sets the rest."""
    try:
        r = requests.post(
            f"{BASE_URL}/api/complaints/",
            json={"title": title, "description": description, "channel": channel},
            headers=_headers(),
            timeout=20,
        )
        return _handle(r)
    except Exception as e:
        return None, str(e)

def update_status(cid, new_status, note=""):
    try:
        r = requests.post(
            f"{BASE_URL}/api/complaints/{cid}/status/",
            json={"status": new_status, "note": note},
            headers=_headers(),
            timeout=10,
        )
        return _handle(r)
    except Exception as e:
        return None, str(e)

def ask_chatbot(question):
    try:
        r = requests.post(
            f"{BASE_URL}/api/chatbot/ask/",
            json={"question": question},
            headers=_headers(),
            timeout=60,
        )
        return _handle(r)
    except Exception as e:
        return None, str(e)

def get_analytics():
    try:
        r = requests.get(f"{BASE_URL}/api/analytics/overview/", headers=_headers(), timeout=10)
        return _handle(r)
    except Exception as e:
        return None, str(e)