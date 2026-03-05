from django.urls import path
from .auth_views import FirebaseLogin
from .views import MeView, AdminOnlyView
from .views import AllUsersView, SignupView

urlpatterns = [
    path("firebase-login/", FirebaseLogin.as_view(), name="firebase-login"),
    path("me/", MeView.as_view()),
    path("admin-only/", AdminOnlyView.as_view()),
    path("all/", AllUsersView.as_view()),
    path("signup/", SignupView.as_view()),
]
# as_view() converts the class into a callable view function 
# views.func_name() we use when it is function based view