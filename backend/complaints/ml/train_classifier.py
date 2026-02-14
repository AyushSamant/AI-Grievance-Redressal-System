import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "category_model.joblib"

TRAIN_DATA = [
    ("My blood pressure is high and hospital is not responding", "HEALTH"),
    ("No doctor available in clinic", "HEALTH"),
    ("Road is broken with potholes near my home", "INFRASTRUCTURE"),
    ("Street light not working for 5 days", "INFRASTRUCTURE"),
    ("No water supply since morning", "WATER"),
    ("Water pipeline leakage near society", "WATER"),
    ("Power cut daily for hours", "ELECTRICITY"),
    ("Voltage fluctuation damaged appliances", "ELECTRICITY"),
    ("Garbage not collected and smell is horrible", "SANITATION"),
    ("Drain overflow causing infection", "SANITATION"),
    ("Crop insurance not received", "AGRICULTURE"),
    ("Fertilizer shortage in my village", "AGRICULTURE"),
    ("School teacher absent regularly", "EDUCATION"),
    ("Scholarship not credited", "EDUCATION"),
    ("Theft and harassment in area", "PUBLIC_SAFETY"),
    ("Unsafe area at night, police not responding", "PUBLIC_SAFETY"),
]

def train_and_save():
    X = [x for x, y in TRAIN_DATA]
    y = [y for x, y in TRAIN_DATA]

    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english")),
        ("clf", LogisticRegression(max_iter=200)),
    ])

    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to: {MODEL_PATH}")

if __name__ == "__main__":
    train_and_save()

# here we are training model with some sample complaints it will learn patterns
