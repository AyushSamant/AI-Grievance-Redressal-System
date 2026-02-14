from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminRole
# Create your views here.

class MeView(APIView): # tells me who i am
    permission_classes = [IsAuthenticated] # only valid JWT token or user is autheticated
    def get(self, request):
        return Response({
            "username": request.user.username,
            "email": request.user.email,
            "role": request.user.role,
        })

class AdminOnlyView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole] # user must be authenticated and pass custom permission IsAdminRole (return request.user.role == "ADMIN")

    def get(self, request):
        return Response({"detail": "You are ADMIN. Access granted."})