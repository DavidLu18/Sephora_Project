from __future__ import annotations

from django.db import models
from django.utils import timezone


class MlEntityMap(models.Model):
    """Map internal DB ids to external ML dataset identifiers."""

    ENTITY_CHOICES = [
        ("product", "Product"),
        ("user", "User"),
    ]

    entity_type = models.CharField(max_length=32, choices=ENTITY_CHOICES)
    source = models.CharField(max_length=64, default="sephora_csv")
    external_id = models.CharField(max_length=255)
    product = models.ForeignKey(
        "products.Product",
        related_name="ml_entity_links",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        "users.User",
        related_name="ml_entity_links",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    ncf_index = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ml_entity_map"
        unique_together = (
            "entity_type",
            "source",
            "external_id",
        )
        indexes = [
            models.Index(fields=["entity_type", "product"]),
            models.Index(fields=["entity_type", "user"]),
        ]

    def __str__(self) -> str:
        subject = self.product or self.user or self.external_id
        return f"{self.entity_type}:{subject}"


class PersonalizedSearchLog(models.Model):
    """Store personalization requests & results for future analytics."""

    session_id = models.CharField(max_length=64, db_index=True)
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="personalized_sessions",
    )
    search_query = models.TextField(blank=True)
    skin_profile = models.JSONField(default=dict)
    response_summary = models.JSONField(default=dict)
    algorithm = models.CharField(max_length=64, default="dnn_hybrid_v1")
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "personalized_search_log"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.session_id} - {self.algorithm}"


class PersonalizedFeedback(models.Model):
    """Capture user feedback about the personalized search quality."""

    log = models.ForeignKey(
        PersonalizedSearchLog,
        on_delete=models.CASCADE,
        related_name="feedback",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="personalized_feedback",
    )
    session_id = models.CharField(max_length=64, db_index=True)
    rating = models.PositiveSmallIntegerField()
    helpful = models.BooleanField(null=True, blank=True)
    experience_tags = models.JSONField(default=list, blank=True)
    comment = models.TextField(blank=True)
    retrain_required = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "personalized_feedback"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["session_id"],
                name="personalized_feedback_unique_session",
            )
        ]

    def __str__(self) -> str:
        return f"{self.session_id} feedback ({self.rating})"


class ProductFeatureSnapshot(models.Model):
    """Persisted copy of product metadata used by the ML models."""

    product = models.OneToOneField(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="ml_feature_snapshot",
    )
    external_id = models.CharField(max_length=64, db_index=True)
    brand_id = models.CharField(max_length=64, blank=True)
    brand_name = models.CharField(max_length=255, blank=True)
    loves_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    reviews = models.IntegerField(default=0)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    value_price_usd = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sale_price_usd = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    limited_edition = models.BooleanField(default=False)
    new = models.BooleanField(default=False)
    online_only = models.BooleanField(default=False)
    out_of_stock = models.BooleanField(default=False)
    sephora_exclusive = models.BooleanField(default=False)
    highlights = models.JSONField(default=list, blank=True)
    ingredients = models.JSONField(default=list, blank=True)
    primary_category = models.CharField(max_length=255, blank=True)
    secondary_category = models.CharField(max_length=255, blank=True)
    tertiary_category = models.CharField(max_length=255, blank=True)
    child_count = models.IntegerField(default=0)
    child_min_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    child_max_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ml_product_feature_snapshot"
        indexes = [
            models.Index(fields=["external_id"]),
        ]

    def to_metadata_row(self):
        from .services.product_metadata import ProductMetadataRow

        return ProductMetadataRow(
            product_id=self.external_id,
            product_name=self.product.product_name,
            brand_id=self.brand_id,
            brand_name=self.brand_name,
            loves_count=self.loves_count,
            rating=float(self.rating or 0),
            reviews=self.reviews,
            price_usd=float(self.price_usd or 0),
            value_price_usd=float(self.value_price_usd or 0),
            sale_price_usd=float(self.sale_price_usd or 0),
            limited_edition=int(self.limited_edition),
            new=int(self.new),
            online_only=int(self.online_only),
            out_of_stock=int(self.out_of_stock),
            sephora_exclusive=int(self.sephora_exclusive),
            highlights=list(self.highlights or []),
            ingredients=list(self.ingredients or []),
            primary_category=self.primary_category,
            secondary_category=self.secondary_category,
            tertiary_category=self.tertiary_category,
            child_count=self.child_count,
            child_min_price=float(self.child_min_price or 0),
            child_max_price=float(self.child_max_price or 0),
        )

    def __str__(self) -> str:
        return f"{self.external_id} metadata"


class RecommendationConfig(models.Model):
    """Configurable weights/settings for the recommendation pipeline."""

    dnn_weight = models.FloatField(default=0.6)
    ncf_weight = models.FloatField(default=0.4)
    max_results = models.IntegerField(default=10)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "recommendation_config"

    @classmethod
    def load(cls) -> "RecommendationConfig":
        config = cls.objects.first()
        if config is None:
            config = cls.objects.create()
        return config

    def as_dict(self) -> dict:
        return {
            "dnn_weight": self.dnn_weight,
            "ncf_weight": self.ncf_weight,
            "max_results": self.max_results,
            "updated_at": self.updated_at,
            "updated_by": self.updated_by,
        }