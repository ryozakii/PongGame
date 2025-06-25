# debug_middleware.py

def debug_cookie_middleware(get_response):
    def middleware(request):
        # Before view is called (if needed)
        response = get_response(request)  # Call the actual view

        # Debugging the response headers
        print("DEBUG: Response Set-Cookie Header ->", response.headers.get("Set-Cookie"))

        return response

    return middleware
