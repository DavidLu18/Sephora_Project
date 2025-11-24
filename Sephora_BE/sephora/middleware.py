from django.utils.deprecation import MiddlewareMixin

class DisableCSRFForAPI(MiddlewareMixin):
    """
    Tắt CSRF cho các endpoint /api/
    """
    def process_request(self, request):
        if request.path.startswith("/api/"):
            setattr(request, '_dont_enforce_csrf_checks', True)
