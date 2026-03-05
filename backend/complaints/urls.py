from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComplaintViewSet, CitizenComplaintDetailView, CitizenComplaintListView

router = DefaultRouter()
router.register(r"", ComplaintViewSet, basename="complaint")
urlpatterns = [
    path("my-complaints/", CitizenComplaintListView.as_view()),
    path("my-complaints/<int:pk>/", CitizenComplaintDetailView.as_view()),
    path("", include(router.urls)),
]