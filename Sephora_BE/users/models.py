from django.db import models

class User(models.Model):
    userid = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    passwordhash = models.CharField(max_length=255)
    firstname = models.CharField(max_length=100, blank=True)
    lastname = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    dateofbirth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True)
    skintype = models.CharField(max_length=20, blank=True)
    skinconcerns = models.TextField(blank=True)
    agerange = models.CharField(max_length=20, blank=True)
    skin_tone = models.CharField(max_length=30, blank=True)
    hair_color = models.CharField(max_length=30, blank=True)
    eye_color = models.CharField(max_length=30, blank=True)
    fragrance_pref = models.CharField(max_length=100, blank=True)
    allergy_info = models.TextField(blank=True)
    isactive = models.BooleanField(default=True)
    emailverified = models.BooleanField(default=False)
    registrationsource = models.CharField(max_length=50, default="website")
    createdat = models.DateTimeField(auto_now_add=True)
    updatedat = models.DateTimeField(auto_now=True)
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True)

    class Meta:
        db_table = "users" 
        managed = False     


class UserRole(models.Model):
    ROLE_CHOICES = [
        ("customer", "Customer"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="userid",
        related_name="role_entry",
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_roles"


def get_user_role(email: str | None) -> str:
    if not email:
        return "customer"
    try:
        user = User.objects.select_related("role_entry").get(email=email)
    except User.DoesNotExist:
        return "customer"
    if hasattr(user, "role_entry") and user.role_entry:
        return user.role_entry.role
    return "customer"