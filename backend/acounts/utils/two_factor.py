import pyotp
import qrcode
import base64
from io import BytesIO
from django.conf import settings

def generate_otp_secret() -> str:
    """Generate a new OTP secret key"""
    return pyotp.random_base32()

def verify_otp_code(secret: str, token: str) -> bool:
    """Verify an OTP token"""
    if not secret or not token:
        return False
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(token)
    except:
        return False


def generate_otp_qr_code(email: str, secret: str) -> str:
    """Generate a QR code for OTP setup"""
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        email,
        issuer_name=settings.APP_NAME
    )
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()