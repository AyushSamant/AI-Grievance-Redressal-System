#acts like a bridge between Firebase and Django

from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from rest_framework_simplejwt.tokens import RefreshToken

from config.firebase import init_firebase
from firebase_admin import auth as fb_auth

User = get_user_model()


class FirebaseLogin(APIView): # creating a DRF API endpoint
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Body: { "idToken": "<firebase_id_token>" }
        """
        id_token = request.data.get("idToken") #getting firebase token from request
        if not id_token:
            return Response({"detail": "idToken is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            init_firebase()
            decoded = fb_auth.verify_id_token(id_token)  # verifies signature + expiry :contentReference[oaicite:5]{index=5}
        except Exception:
            return Response({"detail": "Invalid Firebase token"}, status=status.HTTP_401_UNAUTHORIZED)

        uid = decoded.get("uid")
        email = decoded.get("email", "")
        name = decoded.get("name", "")

        # Create/update local user
        user, created = User.objects.get_or_create(username=uid, defaults={"email": email})
        if email and user.email != email:
            user.email = email
        if name and not user.first_name:
            user.first_name = name.split(" ")[0]
        user.save()

        # Issue Django JWT
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": user.role,
            "is_new": created
        })

# what frontend is doing 
# Login → Firebase → get idToken

# while backend
# Receive idToken -> Verify with Firebase -> Create/fetch Django user -> Issue JWT -> Return role + tokens

# after this every API call includes Authorization: Bearer <access_token>