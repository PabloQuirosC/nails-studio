"""Errores de dominio → mapeo HTTP en presentation (evita filtrar detalles)."""


class DomainError(Exception):
    pass


class NotFound(DomainError):
    pass


class Conflict(DomainError):
    pass


class ForbiddenOp(DomainError):
    pass


class InvalidCredentials(DomainError):
    pass


class InactiveUser(DomainError):
    pass


class TokenInvalid(DomainError):
    pass


class TokenExpired(TokenInvalid):
    pass


class NoPermissions(DomainError):
    pass
