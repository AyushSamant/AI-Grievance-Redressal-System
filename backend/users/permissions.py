#here we created a custom permission rules in DRF
# where we check who is allowed to access a particular API endpoint

from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "ADMIN")

class IsOfficerRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "OFFICER")

#I implemented custom DRF permission classes that validate the authenticated user's role field before allowing access to protected endpoints.