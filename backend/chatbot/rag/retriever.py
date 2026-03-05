from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# Match ingest.py exactly:
# ingest.py: BASE_DIR = Path(__file__).resolve().parent.parent.parent  → backend/
#            INDEX_DIR = BASE_DIR / "chatbot" / "rag" / "faiss_index"
# So from retriever.py (which lives at backend/chatbot/rag/retriever.py):
#   .parent      → backend/chatbot/rag/
#   .parent.parent → backend/chatbot/
#   .parent.parent.parent → backend/         ← same as ingest.py BASE_DIR

_THIS_FILE = Path(__file__).resolve()
_BACKEND_DIR = _THIS_FILE.parent.parent.parent   # → backend/
INDEX_DIR = _BACKEND_DIR / "chatbot" / "rag" / "faiss_index"

_embeddings = None
_vectorstore = None


def get_vectorstore():
    global _embeddings, _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    if not INDEX_DIR.exists():
        raise RuntimeError(
            f"FAISS index not found at: {INDEX_DIR}\n"
            "Run this once to build it:\n"
            "  cd backend\n"
            "  python -m chatbot.rag.ingest"
        )

    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

    _vectorstore = FAISS.load_local(
        str(INDEX_DIR),
        _embeddings,
        allow_dangerous_deserialization=True,
    )
    return _vectorstore


def retrieve_context(query: str, k: int = 2) -> str:
    """Return top-k relevant knowledge base chunks as a formatted string."""
    try:
        vs = get_vectorstore()
        docs = vs.similarity_search(query, k=k)
        return "\n\n".join([f"- {d.page_content}" for d in docs])
    except RuntimeError:
        raise   # let the caller handle the "index not found" case cleanly
    except Exception as e:
        # FAISS search errors — return empty context rather than crashing
        return ""