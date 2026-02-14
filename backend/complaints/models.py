from django.db import models
from django.conf import settings
from departments.models import Department
# Create your models here.
# core dataset for analytics and AI
class Complaint(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        IN_REVIEW = "IN_REVIEW", "In Review"
        ASSIGNED = "ASSIGNED", "Assigned"
        RESOLVED = "RESOLVED", "Resolved"
        REJECTED = "REJECTED", "Rejected"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Channel(models.TextChoices):
        TEXT = "TEXT", "Text"
        VOICE = "VOICE", "Voice"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="complaints")
    title = models.CharField(max_length=200)
    description = models.TextField()
    language = models.CharField(max_length=30, default="en")
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.TEXT)
    category = models.CharField(max_length=80, blank=True)
    sentiment = models.CharField(max_length=30, blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    assigned_department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints"
    )
    assigned_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_complaints"
    )
    predicted_resolution_days = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"


class ComplaintMedia(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="media")
    file_url = models.URLField()  # later connection to S3/Firebase storage URL
    media_type = models.CharField(max_length=30, blank=True)  # image/audio/video
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Media for complaint #{self.complaint_id}"
