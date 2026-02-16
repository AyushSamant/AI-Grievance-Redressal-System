from pathlib import Path # handle file system paths
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# here we will load the .txt files
# split into small chunks so that the retrieval is precise
# convert those chunks into vectors
# store those vector in FAISS index on disk
# result will be -> chatbot can search the knowledge base instantly

BASE_DIR = Path(__file__).resolve().parent.parent.parent # this point to backend 
KB_DIR = BASE_DIR.parent / "knowledge_base"  # this points to the knowledge base folder
INDEX_DIR = BASE_DIR / "chatbot" / "rag" / "faiss_index" # point to where the FAISS vector database will be stored (AI Memory Folder)

# looks the folder -> retreive .txt files -> load them into LangChain doc obj
def load_text_docs(folder: Path):
    docs = []
    for path in folder.rglob("*.txt"):
        loader = TextLoader(str(path), encoding = "utf-8")
        docs.extend(loader.load())
    return docs
# something like AI assistant reading all policy manuals before joining work

def build_vectorstore(): # instead of storing a whole giant LAW book we store it as small paras
    docs = load_text_docs(KB_DIR)

    # models work better with small pieces
    # if a doc has 2000 char we brek it into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=600,chunk_overlap=80) # each piece of 600 char while each chunk slightly overlap the previous one so that the context is not break in mid
    chunks = splitter.split_documents(docs)

    #converts text → numbers (vectors)
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # FAISS -> Facebook AI Similarity Search
    # stores embeddings allowing fast similarity search
    vectorstore = FAISS.from_documents(chunks, embeddings)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(INDEX_DIR))

    print(f"Indexed {len(chunks)} chunks from {KB_DIR}")
    print(f"FAISS index saved to {INDEX_DIR}")

# when someone will ask What is SLA? the AI will retrieves the relevant paragraph


if __name__ == "__main__":
    build_vectorstore()

# knowledge_base/*.txt -> Load as documents -> Split into chunks -> Convert to embeddings -> Store in FAISS -> Saved locally

# Later when user asks question 
# Convert question → embedding -> Search FAISS for similar chunks -> Return most relevant text -> Send to LLM with context -> AI answers correctly