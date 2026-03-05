import re
EMERGENCY_PATTERNS = [
    # Medical / health
    (r"heart\s*attack|cardiac\s*arrest|chest\s*pain|stroke|seizure|"
     r"unconscious|not\s*breathing|emergency|ambulance|hospital|"
     r"bleeding|accident\s*victim|injured|critical\s*condition|"
     r"died|death|dead|medical|fever|dengue|cholera|epidemic|"
     r"food\s*poison|overdose|burn\s*victim|drowning",
     "HEALTH", "CRITICAL"),

    # Fire / gas leak
    (r"fire\s*break|gas\s*leak|explosion|building\s*collapse|flood\s*rescue",
     "INFRASTRUCTURE", "CRITICAL"),

    # Crime / safety
    (r"robbery|assault|murder|rape|kidnap|missing\s*child|terrorism",
     "SAFETY", "CRITICAL"),
]

def emergency_override(text: str):
    """
    Returns (category, priority) if the text matches an emergency pattern,
    otherwise returns (None, None).
    Call this BEFORE predict_category().
    """
    lowered = text.lower()
    for pattern, category, priority in EMERGENCY_PATTERNS:
        if re.search(pattern, lowered):
            return category, priority
    return None, None

CATEGORY_TO_DEPT = {
    # Health
    "HEALTH":          "Health & Medical Services",
    "MEDICAL":         "Health & Medical Services",
    "HEALTHCARE":      "Health & Medical Services",

    # Electricity
    "ELECTRICITY":     "Electricity & Power",
    "POWER":           "Electricity & Power",
    "ENERGY":          "Electricity & Power",

    # Water
    "WATER":           "Water Supply & Sanitation",
    "SANITATION":      "Water Supply & Sanitation",
    "DRAINAGE":        "Water Supply & Sanitation",
    "SEWAGE":          "Water Supply & Sanitation",

    # Roads / Infrastructure
    "INFRASTRUCTURE":  "Infrastructure & Roads",
    "ROADS":           "Infrastructure & Roads",
    "ROAD":            "Infrastructure & Roads",
    "TRANSPORT":       "Transport & Traffic",
    "TRAFFIC":         "Transport & Traffic",

    # Safety / Police
    "SAFETY":          "Public Safety & Police",
    "POLICE":          "Public Safety & Police",
    "CRIME":           "Public Safety & Police",
    "SECURITY":        "Public Safety & Police",

    # Agriculture
    "AGRICULTURE":     "Agriculture & Farming",
    "FARMING":         "Agriculture & Farming",
    "CROP":            "Agriculture & Farming",
    "IRRIGATION":      "Agriculture & Farming",

    # Education
    "EDUCATION":       "Education",
    "SCHOOL":          "Education",
    "COLLEGE":         "Education",

    # Revenue / Tax
    "REVENUE":         "Revenue & Taxation",
    "TAXATION":        "Revenue & Taxation",
    "TAX":             "Revenue & Taxation",
    "LAND":            "Revenue & Taxation",

    # Housing
    "HOUSING":         "Housing & Urban Development",
    "CONSTRUCTION":    "Housing & Urban Development",
    "BUILDING":        "Housing & Urban Development",

    # Environment
    "ENVIRONMENT":     "Environment & Waste Management",
    "WASTE":           "Environment & Waste Management",
    "GARBAGE":         "Environment & Waste Management",
    "POLLUTION":       "Environment & Waste Management",

    # General fallback
    "GENERAL":         None,   # leaves department unassigned → admin assigns
}


def resolve_department_name(category: str) -> str | None:
    """Return the Department name for a given category string, or None."""
    return CATEGORY_TO_DEPT.get(category.upper())

SLA_MAP = {
    "CRITICAL": 2,
    "HIGH":     4,
    "MEDIUM":   7,
    "LOW":      14,
}

def compute_sla_days(priority: str) -> int:
    return SLA_MAP.get(str(priority).upper(), 7)


def predict_resolution_days(priority: str, urgency_score) -> int:
    """Simple heuristic — replace with a trained model if available."""
    base = compute_sla_days(priority)
    try:
        score = int(urgency_score or 50)
    except (TypeError, ValueError):
        score = 50
    # Higher urgency → resolves faster (more attention)
    factor = max(0.5, 1.0 - (score - 50) / 200)
    return max(1, int(base * factor))