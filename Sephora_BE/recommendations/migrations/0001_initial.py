from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("products", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="MlEntityMap",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "entity_type",
                    models.CharField(
                        choices=[("product", "Product"), ("user", "User")], max_length=32
                    ),
                ),
                ("source", models.CharField(default="sephora_csv", max_length=64)),
                ("external_id", models.CharField(max_length=255)),
                ("ncf_index", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "product",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ml_entity_links",
                        to="products.product",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ml_entity_links",
                        to="users.user",
                    ),
                ),
            ],
            options={
                "db_table": "ml_entity_map",
            },
        ),
        migrations.CreateModel(
            name="PersonalizedSearchLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_id", models.CharField(db_index=True, max_length=64)),
                ("search_query", models.TextField(blank=True)),
                ("skin_profile", models.JSONField(default=dict)),
                ("response_summary", models.JSONField(default=dict)),
                ("algorithm", models.CharField(default="dnn_hybrid_v1", max_length=64)),
                ("created_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="personalized_sessions",
                        to="users.user",
                    ),
                ),
            ],
            options={
                "db_table": "personalized_search_log",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="mlentitymap",
            index=models.Index(fields=["entity_type", "product"], name="recommend_ml_enti_6efd5b_idx"),
        ),
        migrations.AddIndex(
            model_name="mlentitymap",
            index=models.Index(fields=["entity_type", "user"], name="recommend_ml_enti_f38bb7_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="mlentitymap",
            unique_together={("entity_type", "source", "external_id")},
        ),
    ]

