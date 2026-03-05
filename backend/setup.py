import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
print("=" * 60)
print("  GrievanceAI — Backend Setup")
print("=" * 60)


# ── Step 1: NLTK corpora (required by TextBlob) ───────────────────────────────
print("\n[1/3] Downloading NLTK corpora for TextBlob...")
try:
    import nltk
    for corpus in ["punkt", "punkt_tab", "averaged_perceptron_tagger", "brown"]:
        nltk.download(corpus, quiet=True)
    print("      ✅ NLTK corpora ready.")
except Exception as e:
    print(f"      ⚠️  NLTK download failed: {e}")
    print("         Run manually: python -m nltk.downloader all")


# ── Step 2: Train ML classifier ───────────────────────────────────────────────
print("\n[2/3] Training complaint category classifier...")
try:
    # Add backend to sys.path so imports work
    sys.path.insert(0, str(BASE_DIR))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    from complaints.ml.train_classifier import train_and_save
    train_and_save()
    print("      ✅ Classifier trained and saved to complaints/ml/category_model.joblib")
except Exception as e:
    print(f"      ❌ Classifier training failed: {e}")
    print("         Fix the error above, then re-run this script.")
    sys.exit(1)


# ── Step 3: Build FAISS index from knowledge_base/ ───────────────────────────
print("\n[3/3] Building FAISS vector index from knowledge_base/...")
kb_dir = BASE_DIR.parent / "knowledge_base"

if not kb_dir.exists():
    print(f"      ⚠️  knowledge_base/ not found at: {kb_dir}")
    print("         Create it and add .txt files, then re-run this script.")
    print("         Skipping FAISS build — chatbot will not work until this is done.")
else:
    txt_files = list(kb_dir.rglob("*.txt"))
    if not txt_files:
        print(f"      ⚠️  No .txt files found in {kb_dir}")
        print("         Add knowledge base documents, then re-run this script.")
    else:
        print(f"      Found {len(txt_files)} .txt file(s) in knowledge_base/")
        try:
            from chatbot.rag.ingest import build_vectorstore
            build_vectorstore()
            print("      ✅ FAISS index built successfully.")
        except Exception as e:
            print(f"      ❌ FAISS build failed: {e}")
            print("         Ensure sentence-transformers and faiss-cpu are installed.")
            sys.exit(1)

print("\n" + "=" * 60)
print("  Setup complete! You can now start the server:")
print("  python manage.py runserver")
print("=" * 60 + "\n")