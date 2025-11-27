from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserRole",
            fields=[
                (
                    "user",
                    models.OneToOneField(
                        db_column="userid",
                        on_delete=models.deletion.CASCADE,
                        primary_key=True,
                        related_name="role_entry",
                        serialize=False,
                        to="users.user",
                    ),
                ),
                (
                    "role",
                    models.CharField(
                        choices=[("customer", "Customer"), ("admin", "Admin")],
                        default="customer",
                        max_length=20,
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "user_roles",
            },
        ),
    ]


