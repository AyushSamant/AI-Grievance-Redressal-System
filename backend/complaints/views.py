from rest_framework.response import Response
from rest_framework import status as http_status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .serializers import (
    ComplaintCreateSerializer,
    ComplaintListSerializer,
    ComplaintDetailSerializer,
    ComplaintStatusUpdateSerializer,
)
from .models import Complaint, ComplaintMedia, ComplaintHistory
from .services.preprocess import preprocess_text, whisper_stt_stub
from .services.ai_pipeline import run_ai_and_route
from .permissions import IsOfficerOrAdmin
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .filters import ComplaintFilter
from rest_framework.generics import ListAPIView
class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Complaint.objects.all().order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ComplaintFilter
    search_fields = ["title", "description", "assigned_department__name"]
    ordering_fields = ["urgency_score","priority"]
    

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.is_staff:
            return self.queryset
        role = getattr(user, "role", "CITIZEN")
        if role == "CITIZEN":
            return self.queryset.filter(user=user)
        return self.queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ComplaintCreateSerializer
        if self.action in ("list", "me"):
            return ComplaintListSerializer
        if self.action in ("retrieve", "timeline", "assign_department"):
            return ComplaintDetailSerializer
        if self.action == "status_update":
            return ComplaintStatusUpdateSerializer
        return ComplaintDetailSerializer

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=http_status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=http_status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title   = serializer.validated_data["title"]
        desc    = serializer.validated_data.get("description", "")
        channel = serializer.validated_data.get("channel", "TEXT")
        audio   = serializer.validated_data.get("audio")

        if channel == "VOICE" and audio:
            complaint = Complaint.objects.create(
                user=request.user, title=title, description=desc,
                channel=Complaint.Channel.VOICE,
            )
            media = ComplaintMedia.objects.create(
                complaint=complaint, file=audio, media_type="audio",
            )
            transcript, lang = whisper_stt_stub(media.file.path)
            if transcript.strip():
                complaint.description = transcript
        else:
            complaint = Complaint.objects.create(
                user=request.user, title=title, description=desc,
                channel=Complaint.Channel.TEXT,
            )
            lang = "unknown"

        # Preprocess
        prep = preprocess_text(complaint.description or title)
        complaint.language      = prep.language if lang == "unknown" else lang
        complaint.sentiment     = prep.sentiment_label
        complaint.urgency_score = prep.urgency_score
        complaint.priority      = prep.priority
        complaint.save(update_fields=[
            "language", "sentiment", "urgency_score", "priority"
        ])

        # AI routing (sets category, department, sla_days)
        run_ai_and_route(complaint)
        complaint.refresh_from_db()

        return Response(
            ComplaintDetailSerializer(complaint).data,
            status=http_status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="my-complaints")
    def me(self, request):
        qs = self.filter_queryset(self.get_queryset().filter(user=request.user))
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=http_status.HTTP_200_OK)

    # # ── GET /api/complaints/<id>/timeline/ ────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="timeline")
    def timeline(self, request, pk=None):
         complaint = self.get_object()
         serializer = ComplaintDetailSerializer(complaint)
         return Response(serializer.data, status=http_status.HTTP_200_OK)

    # # ── POST /api/complaints/<id>/assign/ ─────────────────────────────────────
    @action(
         detail=True,
         methods=["post"],
         url_path="assign",
         permission_classes=[IsAuthenticated, IsOfficerOrAdmin],
     )
    def assign_department(self, request, pk=None):
        complaint = self.get_object()

        dept_name = request.data.get("department_name", "").strip()
        if not dept_name:
            return Response(
                {"detail": "department_name is required."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        # Import here to avoid circular imports
        from departments.models import Department

        dept = Department.objects.filter(
            name__iexact=dept_name, is_active=True
        ).first()

        if not dept:
            # Try partial match as fallback
            dept = Department.objects.filter(
                name__icontains=dept_name, is_active=True
            ).first()

        if not dept:
            # Create the department on-the-fly if it doesn't exist yet
            # (happens during initial setup before departments are added)
            dept, _ = Department.objects.get_or_create(
                name=dept_name,
                defaults={"is_active": True, "sla_days": 7},
            )

        complaint.assigned_department = dept
        complaint.save(update_fields=["assigned_department"])

        # Refresh so serializer picks up the new FK
        complaint.refresh_from_db()

        return Response(
            ComplaintDetailSerializer(complaint).data,
            status=http_status.HTTP_200_OK,
        )

    # ── POST /api/complaints/<id>/status/ ─────────────────────────────────────
    @action(
        detail=True,
        methods=["post"],
        url_path="status",
        permission_classes=[IsAuthenticated, IsOfficerOrAdmin],
    )

    def status_update(self, request, pk=None):
        complaint = self.get_object()
        serializer = ComplaintStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        note       = serializer.validated_data.get("note", "")

        if not complaint.can_transition_to(new_status):
            return Response(
                {
                    "detail": f"Invalid transition: {complaint.status} → {new_status}",
                    "allowed": list(
                        Complaint.ALLOWED_TRANSITIONS.get(complaint.status, set())
                    ),
                },
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        old_status     = complaint.status
        complaint.status = new_status
        complaint.save(update_fields=["status"])

        ComplaintHistory.objects.create(
            complaint=complaint,
            actor=request.user,
            from_status=old_status,
            to_status=new_status,
            note=note,
        )

        return Response(
            {"id": complaint.id, "from": old_status, "to": new_status},
            status=http_status.HTTP_200_OK,
        )

    
class CitizenComplaintListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintListSerializer
    queryset = Complaint.objects.all()

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ComplaintFilter
    search_fields = ["title", "description", "assigned_department__name"]
    ordering_fields = ["urgency_score", "priority"]

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)
    
class CitizenComplaintDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk, user=request.user)
        except Complaint.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        serializer = ComplaintListSerializer(complaint)
        return Response(serializer.data)