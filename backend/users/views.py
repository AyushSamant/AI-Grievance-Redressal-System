from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminRole
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import SignupSerializer

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
    
class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    authentication_classes = []

User = get_user_model()

class AllUsersView(generics.ListCreateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()

    def perform_create(self, serializer):
        user = serializer.save()
        user.set_password(self.request.data.get("password"))
        user.save()

class SignupView(APIView):
    authentication_classes = []
    permission_classes     = []

    def get(self, request):
        serializer = SignupSerializer()
        return Response(serializer.data)

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "message":  "Account created successfully.",
                "username": user.username,
                "role":     user.role,
                "access":   str(refresh.access_token),
                "refresh":  str(refresh),
            }, status=201)
        return Response(serializer.errors, status=400)