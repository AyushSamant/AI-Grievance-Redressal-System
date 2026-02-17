from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# the search engine of the RAG
# user ask question -> gets embed -> FAISS returns top matching chunks i.e context
# pass those chunks to the LLM so it answers from your content

BASE_DIR = Path(__file__).resolve().parent 
#INDEX_DIR = BASE_DIR / "chatbot" / "rag" / "faiss_index"
INDEX_DIR = BASE_DIR / "faiss_index"

_embeddings = None
_vectorstore = None


def get_vectorstore():
    global _embeddings, _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    if not INDEX_DIR.exists():
        raise RuntimeError("FAISS index not found. Run: python chatbot/rag/ingest.py")

    """_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    _vectorstore = FAISS.load_local(str(INDEX_DIR), _embeddings, allow_dangerous_deserialization=True)
    return _vectorstore"""

    # hired the analyst once and reuse them
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

    _vectorstore = FAISS.load_local(
        str(INDEX_DIR),
        _embeddings,
        allow_dangerous_deserialization=True
    )

    return _vectorstore


def retrieve_context(query: str, k: int = 2) -> str:
    vs = get_vectorstore()
    docs = vs.similarity_search(query, k=k)
    return "\n\n".join([f"- {d.page_content}" for d in docs])
