from django.db import models
from django.conf import settings
# Create your models here.
# here we creating departments like health, agri, infra etc and department user like which officer belong to which department
# Complaints will reference a department and officer need mapping
class Department(models.Model):
    name = models.CharField(max_length=123, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True) # Used to disable a department without deleting it eg If department is closed temporarily set False
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class DepartmentUser(models.Model): # here we are mapping Officer <-> Department)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dept_memberships")
    # Many-to-Many relationship
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name="members")
    is_lead = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta: # one mapping per user per department.
        unique_together = ("user", "department")

    def __str__(self):
        return f"{self.user.username} -> {self.department.name}"