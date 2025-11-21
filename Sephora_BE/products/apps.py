from django.apps import AppConfig


class SephoraBeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'products'
def ready(self):
    import products.signals
