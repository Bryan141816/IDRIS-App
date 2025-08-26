from typing import Optional, Set
from sqlalchemy.exc import IntegrityError
from fastapi import UploadFile
from PIL import Image

import io, hashlib, secrets, string
# SQLSTATE codes for Postgres
PG_UNIQUE_VIOLATION = "23505"  # unique_violation


def is_unique_violation_on(
    err: IntegrityError,
    *,
    table: str,
    column: Optional[str] = None,
    extra_constraint_names: Optional[Set[str]] = None,
) -> bool:
    """
    True if `err` is Postgres unique_violation (23505) for the given table/column.
    """
    orig = getattr(err, "orig", None)
    if not orig or getattr(orig, "pgcode", None) != PG_UNIQUE_VIOLATION:
        return False

    diag = getattr(orig, "diag", None)
    constraint = getattr(diag, "constraint_name", None) if diag else None
    table_name = getattr(diag, "table_name", None) if diag else None
    column_name = getattr(diag, "column_name", None) if diag else None

    if table_name and table_name != table:
        return False

    expected: Set[str] = {f"{table}_pkey"}
    if column:
        expected.add(f"{table}_{column}_key")
    if extra_constraint_names:
        expected |= set(extra_constraint_names)

    if constraint:
        return constraint in expected
    if column and column_name:
        return column_name == column
    return table_name == table


def _norm_type(donor_type: Optional[str]) -> Optional[str]:
    """Normalize donor type strings."""
    if donor_type is None:
        return None
    v = donor_type.strip().lower()
    if v in {"individual", "ind", "person"}:
        return "individual"
    if v in {"organization", "org", "company"}:
        return "organization"
    return v

def _to_enum(enum_cls, value, default=None):
    """
    Safely coerce strings/Enums/None into the target Enum type.
    - Accepts actual Enum instances, their .name/.value strings, or None.
    """
    if value is None:
        return default
    if isinstance(value, enum_cls):
        return value
    # try by name
    try:
        return enum_cls[value]  # e.g. "ONE_TIME" -> DonationFrequency.ONE_TIME
    except Exception:
        pass
    # try by value (e.g. passing "ONE_TIME" when value==name)
    try:
        return enum_cls(value)
    except Exception:
        pass
    if default is not None:
        return default
    raise ValueError(f"Invalid enum value '{value}' for {enum_cls.__name__}")

def rand_alnum(n=20):
    alphabet = string.ascii_letters + string.digits  # A-Z a-z 0-9
    return ''.join(secrets.choice(alphabet) for _ in range(n))

def uid_from_string(s: str) -> int:
    digest = hashlib.sha256(s.encode()).hexdigest()
    return int(digest, 16) % 90_000_000 + 10_000_000

def process_image_to_webp(upload_file: UploadFile, max_size=(1080, 1080), quality=80) -> bytes:
    contents = upload_file.file.read()
    image = Image.open(io.BytesIO(contents))
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    image.thumbnail(max_size)
    out = io.BytesIO()
    image.save(out, format="WEBP", quality=quality, optimize=True)
    out.seek(0)
    return out.read()
