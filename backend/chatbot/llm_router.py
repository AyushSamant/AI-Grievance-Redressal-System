import os
from chatbot.llm_clients.openrouter_client import call_openrouter
from chatbot.llm_clients.watsonx_client import call_watsonx


class LLMRouterError(Exception):
    pass


def generate_answer(prompt: str) -> dict:
    """
    Try Primary (DeepSeek via OpenRouter) first.
    If it fails, fallback to WatsonX.
    Returns: { "provider": "...", "text": "..."}
    """
    # Primary
    try:
        text = call_openrouter(prompt)
        return {"provider": "openrouter/deepseek", "text": text}
    except Exception as e_primary:
        # Fallback
        try:
            text = call_watsonx(prompt)
            return {"provider": "ibm/watsonx", "text": text}
        except Exception as e_fallback:
            raise LLMRouterError(
                f"Primary failed: {type(e_primary).__name__}. "
                f"Fallback failed: {type(e_fallback).__name__}."
            )



# If the main agent is unavailable the call gets redirected to a backup agent automatically