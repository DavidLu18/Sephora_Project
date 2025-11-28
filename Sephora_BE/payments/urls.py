from django.urls import path
from .views import vnpay_return

urlpatterns = [
    path("vnpay_return/", vnpay_return, name="vnpay_return"),
    
]
