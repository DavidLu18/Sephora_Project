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