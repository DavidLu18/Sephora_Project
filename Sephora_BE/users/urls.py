from django.urls import path
from . import views

urlpatterns = [
    path('check_email/', views.check_email),
    path('register_user/', views.register_user),
    path('login/', views.login_user),
    path("get_user/", views.get_user),
    path("update_user/", views.update_user),
    path("confirm_email_update/", views.confirm_email_update),
]
