from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("userid", models.AutoField(primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("passwordhash", models.CharField(max_length=255)),
                ("firstname", models.CharField(blank=True, max_length=100)),
                ("lastname", models.CharField(blank=True, max_length=100)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("dateofbirth", models.DateField(blank=True, null=True)),
                ("gender", models.CharField(blank=True, max_length=10)),
                ("skintype", models.CharField(blank=True, max_length=20)),
                ("skinconcerns", models.TextField(blank=True)),
                ("agerange", models.CharField(blank=True, max_length=20)),
                ("skin_tone", models.CharField(blank=True, max_length=30)),
                ("hair_color", models.CharField(blank=True, max_length=30)),
                ("eye_color", models.CharField(blank=True, max_length=30)),
                ("fragrance_pref", models.CharField(blank=True, max_length=100)),
                ("allergy_info", models.TextField(blank=True)),
                ("isactive", models.BooleanField(default=True)),
                ("emailverified", models.BooleanField(default=False)),
                ("registrationsource", models.CharField(default="website", max_length=50)),
                ("createdat", models.DateTimeField(auto_now_add=True)),
                ("updatedat", models.DateTimeField(auto_now=True)),
                ("firebase_uid", models.CharField(blank=True, max_length=128, null=True, unique=True)),
            ],
            options={
                "db_table": "users",
                "managed": False,
            },
        ),
    ]


