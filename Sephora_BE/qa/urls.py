from django.urls import path
from .views import ProductQuestionListCreate, ProductAnswerListCreate, QuestionHelpfulToggle

urlpatterns = [
    path('products/<int:product_id>/questions/', ProductQuestionListCreate.as_view(), name='product-questions'),
    path('questions/<int:question_id>/answers/', ProductAnswerListCreate.as_view(), name='question-answers'),
    path('questions/<int:question_id>/helpful/', QuestionHelpfulToggle.as_view(), name='question-helpful'),
]
