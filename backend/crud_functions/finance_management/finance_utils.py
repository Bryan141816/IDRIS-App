import enum
import re
from typing import Iterable, List, Optional, Type, TypeVar, Union

T = TypeVar("T", bound=enum.Enum)

def _normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", s.lower())

def _fuzzy_match(enum_class: Type[T], sn: str) -> Optional[T]:
    # Use enum names so we don't need to import the specific classes
    if enum_class.__name__ == "SpendCategory":
        if "emergency" in sn:   return enum_class["EMERGENCY"]
        if "food" in sn or "water" in sn: return enum_class["FOOD_WATER"]
        if "transport" in sn:   return enum_class["TRANSPORTATION"]
        if "equip" in sn:       return enum_class["EQUIPMENT"]
        if "admin" in sn:       return enum_class["ADMINISTRATIVE"]
    elif enum_class.__name__ == "InflowSource":
        if "government" in sn:  return enum_class["GOVERNMENT_GRANTS_AND_FUNDS"]
        if "private" in sn:     return enum_class["PRIVATE_SECTOR_CONTRIBUTIONS"]
        if "community" in sn:   return enum_class["COMMUNITY_BASED_INITIATIVE"]
        if "monetary" in sn:    return enum_class["MONETARY_DONATIONS"]
        if "donation" in sn:    return enum_class["DONATION"]
    return None

def _to_enums(
    items: Optional[Union[Iterable[Union[str, T]], str, T]],
    enum_class: Type[T],
    *,
    strict: bool = False,
) -> List[T]:
    if items is None:
        seq: Iterable[Union[str, T]] = []
    elif isinstance(items, (str, enum_class)):
        seq = [items]  # type: ignore[list-item]
    else:
        seq = items

    out: List[T] = []
    for raw in seq:
        if isinstance(raw, enum_class):
            out.append(raw); continue

        s = str(raw).strip()
        sn = _normalize(s)

        m = _fuzzy_match(enum_class, sn)
        if m is not None:
            out.append(m); continue

        # exact/normalized fallback
        matched = False
        for mem in enum_class:
            if sn == _normalize(mem.name) or sn == _normalize(str(mem.value)) \
               or s.lower() == mem.name.lower() or s.lower() == str(mem.value).lower():
                out.append(mem); matched = True; break

        if not matched and strict:
            raise ValueError(f"Invalid {enum_class.__name__} value: {raw!r}")

    return out
