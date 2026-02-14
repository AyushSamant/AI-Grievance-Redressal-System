import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "category_model.joblib"
_model = None

def load_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError("Model file missing. Train it first: python complaints/ml/train_classifier.py")
        _model = joblib.load(MODEL_PATH)
    return _model

def predict_category(text: str) -> str:
    model = load_model()
    pred = model.predict([text])[0]
    return str(pred)

# here the model will instantly read a complaint text and stamp it with the right category