# complaints/services/ai_pipeline.py

from django.db import transaction

from complaints.ml.classifier import predict_category
from complaints.services.routing import (
    emergency_override,         
    resolve_department_name,
    compute_sla_days,
    predict_resolution_days,
)
from departments.models import Department


def run_ai_and_route(complaint):
    update_fields = []

    with transaction.atomic():
        full_text = f"{complaint.title or ''} {complaint.description or ''}"

        emg_category, emg_priority = emergency_override(full_text)

        if emg_category:
            complaint.category = emg_category
            complaint.priority = emg_priority
            update_fields += ["category", "priority"]
        else:
            try:
                category = predict_category(full_text)
                complaint.category = category
                update_fields.append("category")
            except Exception:
                complaint.category = "GENERAL"
                update_fields.append("category")

        try:
            dept_name = resolve_department_name(complaint.category)
            if dept_name:
                dept = Department.objects.filter(
                    name__iexact=dept_name, is_active=True
                ).first()
                if dept:
                    complaint.assigned_department = dept
                    update_fields.append("assigned_department")
        except Exception:
            pass  # leave unassigned — admin assigns manually

        # ── Step 4: SLA + predicted resolution ───────────────────────────────
        complaint.sla_days = compute_sla_days(complaint.priority)
        update_fields.append("sla_days")

        complaint.predicted_resolution_days = predict_resolution_days(
            complaint.priority,
            complaint.urgency_score,
        )
        update_fields.append("predicted_resolution_days")

        # ── Step 5: Single targeted save ──────────────────────────────────────
        complaint.save(update_fields=list(set(update_fields)))

    complaint.refresh_from_db()
    return complaint