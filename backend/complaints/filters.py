import django_filters
from .models import Complaint

# complaints/filters.py
import django_filters
from .models import Complaint


class ComplaintFilter(django_filters.FilterSet):
    department_name = django_filters.CharFilter(
        field_name="assigned_department__name",
        lookup_expr="iexact",
        label="Department Name",
    )

    class Meta:
        model = Complaint
        fields = ["department_name", "status"]