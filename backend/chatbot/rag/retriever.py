from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# the search engine of the RAG
# user ask question -> gets embed -> FAISS returns top matching chunks i.e context
# pass those chunks to the LLM so it answers from your content

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
INDEX_DIR = BASE_DIR / "chatbot" / "rag" / "faiss_index"

_embeddings = None
_vectorstore = None


def get_vectorstore():
    global _embeddings, _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    if not INDEX_DIR.exists():
        raise RuntimeError("FAISS index not found. Run: python chatbot/rag/ingest.py")

    _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    _vectorstore = FAISS.load_local(str(INDEX_DIR), _embeddings, allow_dangerous_deserialization=True)
    return _vectorstore


def retrieve_context(query: str, k: int = 4) -> str:
    vs = get_vectorstore()
    docs = vs.similarity_search(query, k=k)
    return "\n\n".join([f"- {d.page_content}" for d in docs])
