from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import ComplaintCreateSerializer
from .models import Complaint, ComplaintMedia
from .services.preprocess import preprocess_text, whisper_stt_stub
# Create your views here.


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

        # If voice: save media + do STT
        if channel == "VOICE" and audio:
            # create complaint early (so media can link to it)
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
            # If transcript exists, append/replace description
            if transcript.strip():
                complaint.description = transcript
        else:
            complaint = Complaint.objects.create(
                user=request.user,
                title=title,
                description=desc,
                channel=Complaint.Channel.TEXT,
            )

        # AI preprocessing on final text
        prep = preprocess_text(complaint.description)

        complaint.language = prep.language if lang == "unknown" else lang
        complaint.sentiment = prep.sentiment_label
        complaint.priority = prep.priority
        complaint.save()

        return Response(
            {
                "id": complaint.id,
                "status": complaint.status,
                "priority": complaint.priority,
                "language": complaint.language,
                "sentiment": complaint.sentiment,
            },
            status=status.HTTP_201_CREATED,
        )
    
# a citizen submits text or a voice note. The system stores the complaint, stores the audio file (if any), and runs “AI intake processing” to tag language, sentiment, and priority before routing later.