from rest_framework import serializers
from .models import Complaint, ComplaintMedia, ComplaintHistory


class ComplaintMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMedia
        fields = ["id", "file", "media_type", "created_at"]


class ComplaintHistorySerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = ComplaintHistory
        fields = ["id", "actor_username", "from_status", "to_status", "note", "created_at"]


class ComplaintListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="assigned_department.name", read_only=True
    )

    class Meta:
        model = Complaint
        fields = [
            "id",
            "title",
            "status",
            "priority",
            "category",       
            "urgency_score",      
            "department_name",
            "created_at",
            "updated_at",
        ]


class ComplaintDetailSerializer(serializers.ModelSerializer):
    """
    Used for GET /api/complaints/<id>/ detail view.
    Full data including history timeline and media attachments.
    """
    department_name = serializers.CharField(
        source="assigned_department.name", read_only=True
    )
    media = ComplaintMediaSerializer(many=True, read_only=True)
    history = ComplaintHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id",
            "title",
            "description",
            "channel",
            "language",
            "sentiment",
            "urgency_score",
            "priority",
            "category",
            "status",
            "department_name",
            "sla_days",
            "predicted_resolution_days",
            "created_at",
            "updated_at",
            "media",
            "history",
        ]


class ComplaintCreateSerializer(serializers.Serializer):
    title       = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    channel     = serializers.ChoiceField(choices=["TEXT", "VOICE"], default="TEXT")
    audio       = serializers.FileField(required=False, allow_null=True)


class ComplaintStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices)
    note   = serializers.CharField(required=False, allow_blank=True)