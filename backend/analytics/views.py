from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from complaints.models import Complaint
from users.permissions import IsAdminRole, IsOfficerRole


class IsAdminOrOfficer(IsAdminRole):
    """
    Allow access if user is ADMIN or OFFICER.
    Inherits from IsAdminRole and extends it.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in ("ADMIN", "OFFICER")
        )


class AdminOverviewStats(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOfficer]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", "CITIZEN")

        # Officers see only their department's complaints
        # Admins see everything
        if role == "OFFICER":
            base_qs = Complaint.objects.filter(
                assigned_department__members__user=user
            )
        else:
            base_qs = Complaint.objects.all()

        by_priority = list(
            base_qs.values("priority")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        by_category = list(
            base_qs.values("category")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        by_department = list(
            base_qs.values("assigned_department__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        by_status = list(
            base_qs.values("status")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # SLA compliance: resolved complaints as % of total
        total    = base_qs.count()
        resolved = base_qs.filter(status__in=["RESOLVED", "CLOSED"]).count()
        sla_pct  = round((resolved / total) * 100, 1) if total else 0.0

        return Response({
            "by_priority":   by_priority,
            "by_category":   by_category,
            "by_department": by_department,
            "by_status":     by_status,
            "summary": {
                "total":       total,
                "resolved":    resolved,
                "sla_percent": sla_pct,
            },
        })