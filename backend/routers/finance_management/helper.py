from datetime import datetime, timezone
import zoneinfo

MANILA_TZ = zoneinfo.ZoneInfo("Asia/Manila")

def parse_resolved_at(value) -> datetime | None:
    if not value:
        return None

    if isinstance(value, datetime):
        dt = value
    else:
        s = str(value).strip()
        # Handle trailing Z (UTC) which datetime.fromisoformat doesn't accept directly
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"

        try:
            dt = datetime.fromisoformat(s)
        except ValueError:
            # Fallbacks for common forms (e.g., datetime-local without seconds)
            for fmt in ("%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%d %H:%M",
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%dT%H:%M"):
                try:
                    dt = datetime.strptime(s, fmt)
                    break
                except ValueError:
                    continue
            else:
                raise ValueError(f"Unrecognized datetime format for resolved_at: {value!r}")

    # If no tzinfo, assume Asia/Manila
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=MANILA_TZ)

    # Normalize to UTC for storage
    return dt.astimezone(timezone.utc)
