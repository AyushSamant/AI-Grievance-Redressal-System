from django.urls import path
from .auth_views import FirebaseLogin

urlpatterns = [
    path("firebase-login/", FirebaseLogin.as_view(), name="firebase-login"),
]