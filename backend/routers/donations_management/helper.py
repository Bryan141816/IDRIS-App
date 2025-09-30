def to_centavos(amount) -> int:
    """
    Convert a numeric or string amount (in PESOS) to centavos (int).
    Examples:
      50      -> 5000
      "50"    -> 5000
      "50.25" -> 5025
    """
    try:
        val = float(amount)
    except (TypeError, ValueError):
        raise ValueError("amount must be a number or numeric string")

    if val < 0:
        raise ValueError("amount must be non-negative")

    # round to 2 decimals then convert to centavos
    return int(round(val * 100))