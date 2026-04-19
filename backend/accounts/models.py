from django.conf import settings
from django.db import models


class UserRole(models.TextChoices):
	SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
	TPO = 'TPO', 'Training and Placement Officer'
	HOD = 'HOD', 'Head of Department'
	VOLUNTEER = 'VOLUNTEER', 'Volunteer'
	STUDENT = 'STUDENT', 'Student'


class UserProfile(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name='profile',
	)
	role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT)
	phone_number = models.CharField(max_length=20, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['user__username']

	def __str__(self) -> str:
		return f'{self.user.username} ({self.role})'
