from chatbot.rag.retriever import retrieve_context
from chatbot.llm_router import generate_answer, LLMRouterError

# Rule-based shortcut responses — fast, no LLM call needed
_SHORTCUTS = {
    ("HIGH",     "RESOLV"): "HIGH priority complaints are typically resolved within 4 days.",
    ("CRITICAL", None):     "CRITICAL complaints are typically resolved within 2 days.",
    ("MEDIUM",   None):     "MEDIUM priority complaints are typically resolved within 7 days.",
    ("LOW",      None):     "LOW priority complaints are typically resolved within 14 days.",
}


def _check_shortcut(question: str) -> str | None:
    """Return a canned answer for common SLA questions, or None."""
    q = question.upper()
    for (keyword1, keyword2), answer in _SHORTCUTS.items():
        if keyword1 in q and (keyword2 is None or keyword2 in q):
            return answer
    return None


def answer_with_rag(question: str) -> dict:
    """
    Full RAG pipeline:
      1. Check rule-based shortcuts (instant, no cost)
      2. Retrieve top-k knowledge base chunks via FAISS
      3. Build a grounded prompt (context + question)
      4. Call LLM (DeepSeek via OpenRouter, fallback to WatsonX)

    Returns:
      {
        "question": str,
        "answer": str,
        "provider": str,   # "openrouter/deepseek" | "ibm/watsonx" | "shortcut"
        "context_used": str,
      }
    """
    # ── Rule-based shortcut ───────────────────────────────────────────────────
    shortcut = _check_shortcut(question)
    if shortcut:
        return {
            "question":     question,
            "answer":       shortcut,
            "provider":     "shortcut",
            "context_used": "Rule-based response",
        }

    # ── RAG: retrieve relevant chunks ─────────────────────────────────────────
    try:
        context = retrieve_context(question, k=2)
    except RuntimeError:
        raise   # FAISS index missing — propagate to view for clean 503
    except Exception:
        context = ""   # empty context — LLM will say it doesn't know

    # ── Build grounded prompt ─────────────────────────────────────────────────
    prompt = f"""You are a formal, helpful grievance redressal assistant.
Use ONLY the context below to answer the question.
If the answer is not in the context, say exactly:
"I don't have that information in my knowledge base yet."

Context:
{context if context else "(No relevant context found)"}

Question: {question}

Answer clearly and formally in 2–4 sentences."""

    # ── LLM call with fallback ────────────────────────────────────────────────
    llm_out = generate_answer(prompt)

    return {
        "question":     question,
        "answer":       llm_out["text"],
        "provider":     llm_out["provider"],
        "context_used": context,
    }