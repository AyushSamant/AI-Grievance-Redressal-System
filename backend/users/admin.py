# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ("username", "email", "role", "phone_number",
                     "is_active", "is_staff", "date_joined")
    list_filter   = ("role", "is_active", "is_staff", "date_joined")
    search_fields = ("username", "email", "phone_number",
                     "first_name", "last_name")
    ordering      = ("-date_joined",)

    fieldsets = (
        (None, {
            "fields": ("username", "password")
        }),
        ("Personal Info", {
            "fields": ("first_name", "last_name", "email", "phone_number")
        }),
        ("Role & Access", {
            "fields": ("role",),
            "description": (
                "CITIZEN — can file & track complaints.  "
                "OFFICER — manages department complaints & status updates.  "
                "ADMIN — full access, analytics, all departments."
            ),
        }),
        ("Permissions", {
            "fields": (
                "is_active", "is_staff", "is_superuser",
                "groups", "user_permissions",
            ),
            "classes": ("collapse",),
        }),
        ("Important Dates", {
            "fields": ("last_login", "date_joined"),
            "classes": ("collapse",),
        }),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "email",
                "password1",
                "password2",
                "role",
                "phone_number",
                "is_active",
                "is_staff",
            ),
        }),
    )

    readonly_fields = ("date_joined", "last_login")