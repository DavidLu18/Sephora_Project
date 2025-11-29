from django.urls import path
from . import views
from . import admin_views
urlpatterns = [
    path('check_email/', views.check_email),
    path('register_user/', views.register_user),
    path('login/', views.login_user),
    path("get_user/", views.get_user),
    path("update_user/", views.update_user),
    path("profile/", views.get_user_profile),
    path("confirm_email_update/", views.confirm_email_update),
    path("admin/customers/", admin_views.admin_list_users),
    path("admin/customers/<int:user_id>/", admin_views.admin_user_detail),
    path("admin/customers/<int:user_id>/toggle-block/", admin_views.admin_toggle_user),
]
