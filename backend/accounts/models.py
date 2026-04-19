from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


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


@receiver(post_save, sender=get_user_model())
def create_or_update_user_profile(sender, instance, created, **kwargs):
	if created:
		profile_role = UserRole.SUPER_ADMIN if instance.is_superuser else UserRole.STUDENT
		UserProfile.objects.create(user=instance, role=profile_role)
		return

	# Ensure profile always exists even for legacy users.
	UserProfile.objects.get_or_create(user=instance)
