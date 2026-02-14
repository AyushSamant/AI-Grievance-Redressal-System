from complaints.ml.classifier import predict_category
from complaints.services.routing import resolve_department_name, compute_sla_days, predict_resolution_days
from departments.models import Department

# the model takes a complaint obkect 
# predicts category -> finds department -> computes SLA and predicted resolution time -> saves all results into DB
def run_ai_and_route(complaint):
    #Category prediction
    category = predict_category(complaint.description or complaint.title)
    complaint.category = category

    #Department mapping
    dept_name = resolve_department_name(category)
    if dept_name:
        dept = Department.objects.filter(name__iexact=dept_name, is_active=True).first()
        complaint.assigned_department = dept

    #SLA + predicted days
    complaint.sla_days = compute_sla_days(complaint.priority)
    complaint.predicted_resolution_days = predict_resolution_days(
        complaint.priority,
        complaint.urgency_score
    )

    complaint.save()
    return complaint
