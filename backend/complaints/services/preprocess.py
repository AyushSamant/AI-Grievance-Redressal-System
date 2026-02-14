from dataclasses import dataclass
from langdetect import detect, LangDetectException
from textblob import TextBlob

@dataclass
class PreprocessResult:
    language: str
    sentiment_label: str
    sentiment_polarity: float
    urgency_score: int
    priority: str

def detect_language(text: str) -> str:
    try:
        return detect(text)  # returns "en", "hi", "fr", ...
    except LangDetectException:
        return "unknown"

def sentiment(text: str) -> tuple[str, float]:
    # TextBlob polarity: -1 (very negative) to +1 (very positive)
    polarity = float(TextBlob(text).sentiment.polarity)
    if polarity <= -0.2:
        return ("negative", polarity)
    if polarity >= 0.2:
        return ("positive", polarity)
    return ("neutral", polarity)

def urgency_score_rule_based(text: str, sentiment_label: str) -> tuple[int, str]:
    """
    Returns (urgency_score 0-100, priority).
    Simple rule-based
    """
    t = text.lower()

    score = 10
    keywords_critical = ["life", "death", "accident", "blood", "fire", "urgent", "emergency", "attack", "hospital"]
    keywords_high = ["danger", "collapsed", "no water", "electric shock", "crime", "harassment", "threat"]

    if any(k in t for k in keywords_critical):
        score += 60
    if any(k in t for k in keywords_high):
        score += 30
    if sentiment_label == "negative":
        score += 10

    score = max(0, min(100, score))

    if score >= 80:
        return (score, "CRITICAL")
    if score >= 55:
        return (score, "HIGH")
    if score >= 30:
        return (score, "MEDIUM")
    return (score, "LOW")

def whisper_stt_stub(audio_path: str) -> tuple[str, str]:
    """
    Placeholder for Whisper.
    Return (transcript, language_code).
    We'll integrate real Whisper next step.
    """
    # Later: run whisper/faster-whisper and return transcript + detected language
    return ("", "unknown")

def preprocess_text(text: str) -> PreprocessResult:
    lang = detect_language(text)
    label, polarity = sentiment(text)
    urg, priority = urgency_score_rule_based(text, label)
    return PreprocessResult(
        language=lang,
        sentiment_label=label,
        sentiment_polarity=polarity,
        urgency_score=urg,
        priority=priority,
    )

# think all this as an AI clerk at the intake counter who before forwarding to departments, the clerk detects language, checks tone (sentiment), and estimates urgency so emergencies don’t wait behind minor issues.