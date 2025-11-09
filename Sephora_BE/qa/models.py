from django.db import models
from products.models import Product

class ProductQuestion(models.Model):
    id = models.AutoField(primary_key=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='questions')
    content = models.TextField()
    helpful_count = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qa_productquestion'  # 👈 Khớp đúng với PostgreSQL
        managed = False  # 🔹 Django sẽ không tạo/xóa bảng này
        app_label = 'qa'

    def __str__(self):
        return f"Q#{self.id} for Product {self.product_id}"


class ProductAnswer(models.Model):
    id = models.AutoField(primary_key=True)
    question = models.ForeignKey(ProductQuestion, on_delete=models.CASCADE, related_name='answers')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qa_productanswer'
        managed = False
        app_label = 'qa'

    def __str__(self):
        return f"A#{self.id} for Q#{self.question_id}"


class QuestionHelpful(models.Model):
    id = models.AutoField(primary_key=True)
    question = models.ForeignKey(ProductQuestion, on_delete=models.CASCADE, related_name='helpful_votes')
    ip_address = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qa_questionhelpful'
        managed = False
        app_label = 'qa'
        unique_together = ('question', 'ip_address')
