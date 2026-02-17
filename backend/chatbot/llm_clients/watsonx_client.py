import os

def call_watsonx(prompt: str) -> str:
    api_key = os.getenv("WATSONX_API_KEY")

    if not api_key:
        # fallback behavior if WatsonX not configured
        return (
            "I'm currently using a fallback response mode. "
            "Based on the provided knowledge base context, please review the extracted policy section above. "
            "If you need a generated answer, the WatsonX fallback can be enabled with credentials."
        )

    raise NotImplementedError("WatsonX is not fully configured yet.")

# Even if the backup provider isn’t configured, the system doesn’t “crash” It returns a safe message.