from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import ComplaintCreateSerializer
from .models import Complaint, ComplaintMedia
from .services.preprocess import preprocess_text, whisper_stt_stub

from .services.ai_pipeline import run_ai_and_route


class ComplaintCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Text complaint:
          { "title": "...", "description": "...", "channel": "TEXT" }

        Voice complaint (multipart/form-data):
          title, description(optional), channel="VOICE", audio=<file>
        """

        serializer = ComplaintCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data["title"]
        desc = serializer.validated_data.get("description", "")
        channel = serializer.validated_data.get("channel", "TEXT")
        audio = serializer.validated_data.get("audio")

        transcript = ""
        lang = "unknown"

        if channel == "VOICE" and audio:
            complaint = Complaint.objects.create(
                user=request.user,
                title=title,
                description=desc,
                channel=Complaint.Channel.VOICE,
            )

            media = ComplaintMedia.objects.create(
                complaint=complaint,
                file=audio,
                media_type="audio",
            )

            transcript, lang = whisper_stt_stub(media.file.path)
            if transcript.strip():
                complaint.description = transcript

        else:
            complaint = Complaint.objects.create(
                user=request.user,
                title=title,
                description=desc,
                channel=Complaint.Channel.TEXT,
            )

        prep = preprocess_text(complaint.description)

        complaint.language = prep.language if lang == "unknown" else lang
        complaint.sentiment = prep.sentiment_label
        complaint.priority = prep.priority
        complaint.urgency_score = prep.urgency_score  # ✅ NEW (make sure model has this field)
        complaint.save()

        run_ai_and_route(complaint)

        return Response(
            {
                "id": complaint.id,
                "status": complaint.status,

                "priority": complaint.priority,
                "urgency_score": complaint.urgency_score,

                "language": complaint.language,
                "sentiment": complaint.sentiment,

                "category": complaint.category,
                "assigned_department": complaint.assigned_department.name if complaint.assigned_department else None,

                "sla_days": complaint.sla_days,
                "predicted_resolution_days": complaint.predicted_resolution_days,
            },
            status=status.HTTP_201_CREATED,
        )

# a citizen submits text or a voice note. The system stores the complaint, stores the audio file (if any), and runs “AI intake processing” to tag language, sentiment, and priority before routing later.
# file complaint -> system first records it (like a receipt)
# AI intake officer -> reads the complaint, detects language + sentiment, calculates urgency, predicts category (Health/Infrastructure/etc.)
# assign the correct dept.a automatically, and attaches a target timeline (SLA)
# return a confirmation summary back to the citizen