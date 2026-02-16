import os
import requests

# talk to the AI model
def call_llm(prompt: str) -> str:
    """
    Minimal LLM client using OpenRouter-style API (works for DeepSeek via OpenRouter).
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")

    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY not set in .env")

    url = "https://openrouter.ai/api/v1/chat/completions"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a helpful grievance redressal assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]
