from django.urls import path
from . import views

urlpatterns = [
    path("cities/", views.get_cities),
    path("wards/<int:city_code>/", views.get_wards_by_city),
]
