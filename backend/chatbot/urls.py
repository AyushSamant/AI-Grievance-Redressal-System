from django.urls import path
from .views import ChatAskView

urlpatterns = [
    path("ask/", ChatAskView.as_view(), name="chat_ask"),
]
