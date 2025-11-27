from django.db import migrations, models


def create_default_config(apps, schema_editor):
    Config = apps.get_model("recommendations", "RecommendationConfig")
    if Config.objects.exists():
        return
    Config.objects.create(dnn_weight=0.6, ncf_weight=0.4, max_results=10)


class Migration(migrations.Migration):

    dependencies = [
    ("recommendations", "0003_rename_recommend_ml_enti_6efd5b_idx_ml_entity_m_entity__79b057_idx_and_more"),
   ]

    operations = [
        migrations.CreateModel(
            name="RecommendationConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("dnn_weight", models.FloatField(default=0.6)),
                ("ncf_weight", models.FloatField(default=0.4)),
                ("max_results", models.IntegerField(default=10)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("updated_by", models.CharField(blank=True, max_length=255)),
            ],
            options={
                "db_table": "recommendation_config",
            },
        ),
        migrations.RunPython(create_default_config, migrations.RunPython.noop),
    ]


