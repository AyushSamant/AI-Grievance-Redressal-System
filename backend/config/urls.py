from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt         

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.conf import settings
from django.conf.urls.static import static
from users.views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("users.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/complaints/", include("complaints.urls")),
    path("api/users/", include("users.urls")),
    path("api/contact/", include("contact.urls")),
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"), # URL endpoint for generating JWT tokens
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"), # returns a new access token when access token expires
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# This makes uploaded files accessible during development so the frontend can preview the uploaded audio/image like showing attached proof on the complaint screen