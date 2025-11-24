from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationListAPIView, NotificationReadAPIView
from .admin_views import (
    NotificationTemplateAdminViewSet,
    ScheduledNotificationAdminViewSet
)

router = DefaultRouter()
router.register("admin/templates", NotificationTemplateAdminViewSet, basename="admin-templates")
router.register("admin/schedules", ScheduledNotificationAdminViewSet, basename="admin-schedules")

urlpatterns = [
    # USER
    path("", NotificationListAPIView.as_view()),
    path("read/<int:noti_id>/", NotificationReadAPIView.as_view()),

    # ADMIN
    path("", include(router.urls)),
]
