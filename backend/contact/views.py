# contact/views.py
"""
POST /api/contact/
Sends contact form email to admin AND a copy to the sender.

Setup required in settings.py:
  EMAIL_BACKEND   = 'django.core.mail.backends.smtp.EmailBackend'
  EMAIL_HOST      = 'smtp.gmail.com'
  EMAIL_PORT      = 587
  EMAIL_USE_TLS   = True
  EMAIL_HOST_USER = 'your-gmail@gmail.com'        # sender Gmail
  EMAIL_HOST_PASSWORD = 'your-app-password'        # Gmail App Password
  DEFAULT_FROM_EMAIL = 'NivaranAI <your-gmail@gmail.com>'
"""

from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

ADMIN_EMAIL = "thenivaranai@gmail.com"


@method_decorator(csrf_exempt, name="dispatch")
class ContactView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    def post(self, request):
        name    = request.data.get("name", "").strip()
        email   = request.data.get("email", "").strip()
        phone   = request.data.get("phone", "").strip()
        message = request.data.get("message", "").strip()

        if not name or not email or not message:
            return Response({"detail": "name, email and message are required."}, status=400)

        # ── Email to admin ────────────────────────────────────────────────
        admin_body = f"""
New contact form submission from NivaranAI:

Name    : {name}
Email   : {email}
Phone   : {phone or 'Not provided'}
Message :
{message}
"""
        try:
            send_mail(
                subject=f"[NivaranAI] Contact from {name}",
                message=admin_body,
                from_email=None,         # uses DEFAULT_FROM_EMAIL
                recipient_list=[ADMIN_EMAIL],
                fail_silently=False,
            )
        except Exception as e:
            return Response({"detail": f"Failed to send: {str(e)}"}, status=500)

        # ── Copy to sender ────────────────────────────────────────────────
        sender_body = f"""
Hi {name},

Thank you for reaching out to NivaranAI!

We have received your message and will get back to you shortly.

Your message:
{message}

---
NivaranAI — AI-Powered Citizen Grievance Redressal
thenivaranai@gmail.com
"""
        try:
            send_mail(
                subject="[NivaranAI] We received your message",
                message=sender_body,
                from_email=None,
                recipient_list=[email],
                fail_silently=True,      # don't fail if copy doesn't send
            )
        except Exception:
            pass

        return Response({"detail": "Message sent successfully."}, status=200)