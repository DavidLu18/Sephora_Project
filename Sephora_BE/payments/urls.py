from django.urls import path
from .views import (
    get_payment_methods,
    add_payment_method,
    delete_payment_method,
    set_default_payment_method,
    vnpay_return
)

urlpatterns = [
    path("methods/", get_payment_methods),
    path("methods/add/", add_payment_method),
    path("methods/<int:method_id>/delete/", delete_payment_method),
    path("methods/<int:method_id>/set-default/", set_default_payment_method),
    path("vnpay_return/", vnpay_return, name="vnpay_return"),
]
