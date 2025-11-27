from django.urls import path

from . import views

urlpatterns = [
    path("personalized-search/", views.personalized_search, name="personalized-search"),
    path("personalized-feedback/", views.submit_personalized_feedback, name="personalized-feedback"),
    path("feedback-summary/", views.personalized_feedback_summary, name="personalized-feedback-summary"),
    path("config/", views.recommendation_config_view, name="recommendation-config"),
]

