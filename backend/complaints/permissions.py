from rest_framework.permissions import BasePermission

class IsOfficerOrAdmin(BasePermission):
    def has_permission(self, request, view): # Only authorized staff should update case status
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("OFFICER", "ADMIN")
        )