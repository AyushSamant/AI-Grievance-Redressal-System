from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
# Creating a Custom User Model
# instead of deafult user auth.User we are creating are own users.User as we need roles + future scalability
# Abstract Users - django default built-in-user model

class User(AbstractUser): # taking django's default User and adding more fields
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("CITIZEN", "Citizen"),
        ("OFFICER", "Department Officer"),
    )

    #every user has a role
    role = models.CharField( 
        max_length=20,
        choices=ROLE_CHOICES,
        default="CITIZEN"
    )

    phone_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"
    
#Note: Since my AI-powered grievance system requires role-based access control and future authentication scalability, 
    #I extended Django’s AbstractUser to include role management and additional metadata fields