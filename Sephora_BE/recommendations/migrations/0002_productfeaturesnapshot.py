from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0001_initial"),
        ("recommendations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductFeatureSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_id", models.CharField(db_index=True, max_length=64)),
                ("brand_id", models.CharField(blank=True, max_length=64)),
                ("brand_name", models.CharField(blank=True, max_length=255)),
                ("loves_count", models.IntegerField(default=0)),
                ("rating", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("reviews", models.IntegerField(default=0)),
                ("price_usd", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("value_price_usd", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("sale_price_usd", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("limited_edition", models.BooleanField(default=False)),
                ("new", models.BooleanField(default=False)),
                ("online_only", models.BooleanField(default=False)),
                ("out_of_stock", models.BooleanField(default=False)),
                ("sephora_exclusive", models.BooleanField(default=False)),
                ("highlights", models.JSONField(blank=True, default=list)),
                ("ingredients", models.JSONField(blank=True, default=list)),
                ("primary_category", models.CharField(blank=True, max_length=255)),
                ("secondary_category", models.CharField(blank=True, max_length=255)),
                ("tertiary_category", models.CharField(blank=True, max_length=255)),
                ("child_count", models.IntegerField(default=0)),
                ("child_min_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("child_max_price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "product",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ml_feature_snapshot",
                        to="products.product",
                    ),
                ),
            ],
            options={
                "db_table": "ml_product_feature_snapshot",
            },
        ),
    ]


