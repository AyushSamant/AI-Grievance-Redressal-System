from rest_framework import serializers
from .models import Complaint, ComplaintMedia

class ComplaintCreateSerializer(serializers.ModelSerializer):
    audio = serializers.FileField(required=False, allow_null=True)
    channel = serializers.ChoiceField(choices=Complaint.Channel.choices, required=False)

    class Meta:
        model = Complaint
        fields = ["title", "description", "channel", "audio"]

    def validate(self, attrs):
        channel = attrs.get("channel", "TEXT")
        audio = attrs.get("audio")

        if channel == "VOICE" and not audio:
            raise serializers.ValidationError("audio file is required for VOICE complaints")

        return attrs

class ComplaintMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMedia
        fields = ["id", "media_type", "file", "created_at"]

# a form validator at the complaint desk if someone says “VOICE complaint” but doesn’t attach audio, we reject it politely, so the backend doesn’t crash