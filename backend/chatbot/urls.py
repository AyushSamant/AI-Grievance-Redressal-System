from django.urls import path
from . import views
from .views import ChatAskView, chat_page

urlpatterns = [
    path("ask/", ChatAskView.as_view(), name="chat_ask"),
    path("", views.chat_page, name="chat_page"),
]
