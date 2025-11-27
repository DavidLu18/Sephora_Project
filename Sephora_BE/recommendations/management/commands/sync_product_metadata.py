from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from products.models import Product
from recommendations.models import MlEntityMap, ProductFeatureSnapshot
from recommendations.services.product_metadata import ProductMetadataRepository


class Command(BaseCommand):
    help = "Sync ML metadata from product_info.csv into database snapshots and mapping table."

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            dest="csv_path",
            default=str(settings.ML_ARTIFACTS["PRODUCT_CSV"]),
            help="Path tới file product_info.csv (mặc định dùng cấu hình trong settings).",
        )

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        repo = ProductMetadataRepository(csv_path)
        created = updated = skipped = 0

        with transaction.atomic():
            for entry in repo.all_metadata():
                product = Product.objects.filter(sku=entry.product_id).first()
                if not product:
                    skipped += 1
                    continue

                snapshot_values = {
                    "external_id": entry.product_id,
                    "brand_id": entry.brand_id,
                    "brand_name": entry.brand_name,
                    "loves_count": entry.loves_count,
                    "rating": entry.rating,
                    "reviews": entry.reviews,
                    "price_usd": entry.price_usd,
                    "value_price_usd": entry.value_price_usd,
                    "sale_price_usd": entry.sale_price_usd,
                    "limited_edition": bool(entry.limited_edition),
                    "new": bool(entry.new),
                    "online_only": bool(entry.online_only),
                    "out_of_stock": bool(entry.out_of_stock),
                    "sephora_exclusive": bool(entry.sephora_exclusive),
                    "highlights": entry.highlights,
                    "ingredients": entry.ingredients,
                    "primary_category": entry.primary_category,
                    "secondary_category": entry.secondary_category,
                    "tertiary_category": entry.tertiary_category,
                    "child_count": entry.child_count,
                    "child_min_price": entry.child_min_price,
                    "child_max_price": entry.child_max_price,
                }

                snapshot, created_flag = ProductFeatureSnapshot.objects.update_or_create(
                    product=product,
                    defaults=snapshot_values,
                )
                if created_flag:
                    created += 1
                else:
                    updated += 1

                MlEntityMap.objects.update_or_create(
                    entity_type="product",
                    source="sephora_csv",
                    external_id=entry.product_id,
                    defaults={"product": product},
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Đồng bộ metadata hoàn tất. Tạo mới {created}, cập nhật {updated}, bỏ qua {skipped} sản phẩm (không tìm thấy SKU)."
            )
        )


