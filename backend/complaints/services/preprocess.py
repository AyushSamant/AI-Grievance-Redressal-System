from dataclasses import dataclass

try:
    from textblob import TextBlob
    # Trigger a test to confirm corpora are available
    TextBlob("test").sentiment
    _TEXTBLOB_OK = True
except Exception:
    try:
        import nltk
        nltk.download("punkt",         quiet=True)
        nltk.download("punkt_tab",     quiet=True)
        nltk.download("averaged_perceptron_tagger", quiet=True)
        nltk.download("brown",         quiet=True)
        from textblob import TextBlob
        _TEXTBLOB_OK = True
    except Exception:
        _TEXTBLOB_OK = False

from langdetect import detect, LangDetectException


@dataclass
class PreprocessResult:
    language: str
    sentiment_label: str
    sentiment_polarity: float
    urgency_score: int
    priority: str


def detect_language(text: str) -> str:
    if len(text.strip()) < 10:
        return "en"   # too short for reliable detection
    try:
        return detect(text)
    except LangDetectException:
        return "unknown"


def sentiment(text: str) -> tuple[str, float]:
    if not _TEXTBLOB_OK:
        # Safe fallback — neutral sentiment if TextBlob unavailable
        return ("neutral", 0.0)
    try:
        polarity = float(TextBlob(text).sentiment.polarity)
    except Exception:
        return ("neutral", 0.0)

    if polarity <= -0.2:
        return ("negative", polarity)
    if polarity >= 0.2:
        return ("positive", polarity)
    return ("neutral", polarity)


def urgency_score_rule_based(text: str, sentiment_label: str) -> tuple[int, str]:
    """
    Returns (urgency_score 0–100, priority string).
    Scores are clamped before priority assignment.
    """
    t = text.lower()
    score = 10

    keywords_critical = [
        "life", "death", "accident", "blood", "fire", "urgent", "emergency",
        "attack", "hospital", "not responding", "blood pressure", "heart",
        "unconscious", "severe", "critical", "dying",
    ]
    keywords_high = [
        "danger", "collapsed", "no water", "electric shock", "crime",
        "harassment", "threat", "flooding", "outbreak",
    ]

    for k in keywords_critical:
        if k in t:
            score += 60
            break   # one match is enough for critical tier

    for k in keywords_high:
        if k in t:
            score += 30
            break

    if sentiment_label == "negative":
        score += 10

    # Clamp BEFORE deciding priority
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
    Placeholder for Whisper STT.
    Returns (transcript, language_code).
    TODO: Integrate faster-whisper or openai-whisper here.
    """
    return ("", "unknown")


def preprocess_text(text: str) -> PreprocessResult:
    if not text or not text.strip():
        # Guard against empty description
        return PreprocessResult(
            language="unknown",
            sentiment_label="neutral",
            sentiment_polarity=0.0,
            urgency_score=10,
            priority="MEDIUM",
        )

    lang               = detect_language(text)
    label, polarity    = sentiment(text)
    urg, priority      = urgency_score_rule_based(text, label)

    return PreprocessResult(
        language=lang,
        sentiment_label=label,
        sentiment_polarity=polarity,
        urgency_score=urg,
        priority=priority,
    )