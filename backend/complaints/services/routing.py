from typing import Optional

#routing rulebook
# the system use it to detect the department of that complain 
# when a complaint is categorized (Health/Water/etc.), it gets routed to that department and assigned a target timeline (SLA (Service Level Agreement)- Decide how fast it should be resolved)
CATEGORY_TO_DEPT = {
    "HEALTH": "Health",
    "INFRASTRUCTURE": "Infrastructure",
    "AGRICULTURE": "Agriculture",
    "EDUCATION": "Education",
    "SANITATION": "Sanitation",
    "WATER": "Water Supply",
    "ELECTRICITY": "Electricity",
    "PUBLIC_SAFETY": "Public Safety",
}

#defines how many days the department must resolve the issue
SLA_BY_PRIORITY = {
    "CRITICAL": 2,
    "HIGH": 4,
    "MEDIUM": 7,
    "LOW": 14,
}

def resolve_department_name(category: str) -> Optional[str]:
    return CATEGORY_TO_DEPT.get(category) # .get would return None safely

def compute_sla_days(priority: str) -> int:
    return SLA_BY_PRIORITY.get(priority, 7) # default to 7 days

def predict_resolution_days(priority: str, urgency_score: int) -> int:
    """
    Higher urgency/priority -> shorter target days.
    """
    base = compute_sla_days(priority)
    if urgency_score >= 80:
        return max(1, base - 1)
    if urgency_score <= 20:
        return base + 2
    return base
