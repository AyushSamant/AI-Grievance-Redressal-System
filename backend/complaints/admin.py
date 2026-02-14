from django.contrib import admin
from .models import Complaint, ComplaintMedia
# Register your models here.

class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "priority", "assigned_department", "created_at")
    list_filter = ("status", "priority", "assigned_department")
    search_fields = ("title", "description")

admin.site.register(Complaint, ComplaintAdmin)
admin.site.register(ComplaintMedia)