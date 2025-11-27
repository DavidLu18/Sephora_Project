from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("recommendations", "0004_recommendationconfig"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PersonalizedFeedback",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("session_id", models.CharField(db_index=True, max_length=64)),
                ("rating", models.PositiveSmallIntegerField()),
                ("helpful", models.BooleanField(blank=True, null=True)),
                ("experience_tags", models.JSONField(blank=True, default=list)),
                ("comment", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "log",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="feedback",
                        to="recommendations.personalizedsearchlog",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="personalized_feedback",
                        to="users.user",
                    ),
                ),
            ],
            options={
                "db_table": "personalized_feedback",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="personalizedfeedback",
            constraint=models.UniqueConstraint(
                fields=("session_id",),
                name="personalized_feedback_unique_session",
            ),
        ),
    ]


