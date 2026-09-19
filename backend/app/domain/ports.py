"""Puertos del dominio (contratos; implementados en infrastructure)."""
from typing import Protocol


class PasswordHasher(Protocol):
    def hash(self, plain: str) -> str: ...
    def verify(self, plain: str, hashed: str) -> bool: ...


class TokenIssuer(Protocol):
    def access(self, *, sub: str, username: str, roles: list[str], permissions: list[str]) -> tuple[str, int]: ...
