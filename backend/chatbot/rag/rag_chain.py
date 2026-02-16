from chatbot.rag.retriever import retrieve_context
from chatbot.llm_client import call_llm

def answer_with_rag(question: str) -> dict:
    context = retrieve_context(question, k=4)

    prompt = f"""
Use ONLY the context below to answer the user's question.
If the answer is not present in the context, say: "I don't have that information in my knowledge base yet."

Context:
{context}

User Question:
{question}

Answer in a clear, formal, helpful tone.
"""

    answer = call_llm(prompt)

    return {
        "question": question,
        "answer": answer,
        "context_used": context
    }

"""from chatbot.rag.retriever import retrieve_context

def answer_with_rag(question: str) -> dict:
    context = retrieve_context(question, k=4)

    if not context.strip():
        return {
            "question": question,
            "answer": "I don't have that information in my knowledge base yet.",
            "context_used": context
        }

    answer = (
        "Here is the most relevant information I found in the knowledge base:\n\n"
        f"{context}\n\n"
        "If you want me to generate a clean final answer, we need to connect an LLM key (OpenRouter/DeepSeek)."
    )
    # instead of long long answers we can use 
    q = question.lower()
    if "high" in q and "how long" in q:
        answer = "HIGH priority complaints typically have an SLA of 4 days."
    elif "critical" in q and "how long" in q:
        answer = "CRITICAL priority complaints typically have an SLA of 2 days."
    elif "medium" in q and "how long" in q:
        answer = "MEDIUM priority complaints typically have an SLA of 7 days."
    elif "low" in q and "how long" in q:
        answer = "LOW priority complaints typically have an SLA of 14 days."
    else:
        answer = "I found relevant information in the knowledge base. Please review the extracted context below."

    return {
        "question": question,
        "answer": answer,
        "context_used": context
    }
"""
# Retrieve relevant chunks -> Inject chunks into prompt -> Ask LLM to answer only using retrieved context