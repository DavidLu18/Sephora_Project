from django.urls import path
from .views import ProductQuestionListCreate, ProductAnswerListCreate, QuestionHelpfulToggle
from .admin_views import (
    AdminQuestionList,
    AdminQuestionAnswer,
    AdminQuestionDelete,
)
urlpatterns = [
    path('products/<int:product_id>/questions/', ProductQuestionListCreate.as_view(), name='product-questions'),
    path('questions/<int:question_id>/answers/', ProductAnswerListCreate.as_view(), name='question-answers'),
    path('questions/<int:question_id>/helpful/', QuestionHelpfulToggle.as_view(), name='question-helpful'),
    
    path('admin/questions/', AdminQuestionList.as_view(), name='admin-question-list'),
    path("admin/questions/<int:pk>/delete/", AdminQuestionDelete.as_view()),
    path('admin/questions/<int:pk>/answer/', AdminQuestionAnswer.as_view(), name='admin-question-answer'),
]
