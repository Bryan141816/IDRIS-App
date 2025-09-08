from typing import Optional, Set
from sqlalchemy.exc import IntegrityError
from fastapi import UploadFile
from PIL import Image

import io, hashlib, secrets, string, random
# SQLSTATE codes for Postgres
PG_UNIQUE_VIOLATION = "23505"  # unique_violation
ALPHABET = string.ascii_letters + string.digits  # 62 symbols


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


def uid_from_string(s: str, length: int = 6, salt: str = "") -> str:
    """
    Deterministic base62 code from a string (and optional salt/namespace).
    Increase `length` to reduce collision risk.
    """
    digest = hashlib.sha256((salt + s).encode()).digest()  # 32 bytes
    # Convert the full hash to an int, then base62-encode and take the prefix
    n = int.from_bytes(digest, "big")

    chars = []
    base = len(ALPHABET)
    while n > 0:
        n, r = divmod(n, base)
        chars.append(ALPHABET[r])
    base62 = "".join(reversed(chars)) or ALPHABET[0]

    # If base62 shorter than needed, pad using more hash bits (repeat hash)
    if len(base62) < length:
        # Derive extra entropy by hashing the hash text once more
        d2 = hashlib.sha256(digest).digest()
        n2 = int.from_bytes(d2, "big")
        while len(base62) < length:
            n2, r = divmod(n2, base)
            base62 += ALPHABET[r]

    return base62[:length]
    
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

def random_suffix(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))