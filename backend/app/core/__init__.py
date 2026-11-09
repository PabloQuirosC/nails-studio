"""Core security and configuration for Nails Studio backend.

Exports:
- Settings: Configuración central fail-closed
- JWKS_SCHEMES_ALLOWED: Set of allowed URL schemes for JWKS fetches
- JWKSClient: JWKS client endurecido (corrige #14, #16, #18, #19)
- decode_token: Función de decodificación JWT endurecida (corrige #1, #6, #7, #8, #17, #19, #21, #22)
- JWKSClient: Cliente JWKS con allowlist de esquemas, validación PEM, sin redirects
"""
from .config import settings
from .jwks_client import JWKSClient, JWKS_SCHEMES_ALLOWED
from .tokens import decode_token, unsafe_sub, create_access_token, create_refresh_token, REFRESH_TYPE, ACCESS_TYPE

__all__ = [
    "settings",
    "JWKS_SCHEMES_ALLOWED",
    "JWKSClient",
    "decode_token",
    "unsafe_sub",
    "create_access_token",
    "create_refresh_token",
    "REFRESH_TYPE",
    "ACCESS_TYPE",
]