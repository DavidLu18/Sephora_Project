from django.contrib import admin

from . import models


@admin.register(models.MlEntityMap)
class MlEntityMapAdmin(admin.ModelAdmin):
    list_display = ("entity_type", "external_id", "product", "user", "source", "ncf_index")
    list_filter = ("entity_type", "source")
    search_fields = ("external_id", "product__product_name", "user__email")


@admin.register(models.PersonalizedSearchLog)
class PersonalizedSearchLogAdmin(admin.ModelAdmin):
    list_display = ("session_id", "algorithm", "user", "created_at")
    list_filter = ("algorithm", "created_at")
    search_fields = ("session_id", "search_query", "user__email")

