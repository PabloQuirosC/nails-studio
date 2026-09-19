"""Base declarativa + enums compartidos (SQLAlchemy 2.x estilo Mapped)."""
import enum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED = "BLOCKED"


class PermissionType(str, enum.Enum):
    READ = "READ"
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    MANAGE = "MANAGE"
