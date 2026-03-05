from django.urls import path
from .views import AdminOverviewStats

urlpatterns = [
    path("overview/", AdminOverviewStats.as_view(), name="admin_overview"),
]