import io
from decimal import Decimal, InvalidOperation
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
from models import Donation, DonationType

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

def _safe_amount(value: Optional[Decimal]) -> str:
    try:
        if value is None:
            return "0.00"
        # Ensure Decimal and two decimals
        dec = Decimal(value).quantize(Decimal("0.01"))
        return f"{dec:,.2f}"
    except (InvalidOperation, ValueError, TypeError):
        return "0.00"

def generate_donation_receipt(donation) -> io.BytesIO:
    """
    Generates a PDF receipt for a given donation and returns it as an in-memory buffer.
    Defensive: uses valid style names and catches exceptions so you can debug.
    """
    buffer = io.BytesIO()

    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    styles = getSampleStyleSheet()

    # Use existing style names from sample stylesheet
    title_style = styles.get("Heading1", styles["Title"])
    h2_style = styles.get("Heading2", styles["Heading1"])
    h3_style = styles.get("Heading3", styles["Heading2"])
    normal = styles["Normal"]

    story = []

    # Title
    # center the title if you want
    title_style.alignment = TA_CENTER
    story.append(Paragraph("Donation Receipt", title_style))
    story.append(Spacer(1, 0.25 * inch))

    # Donor Information
    donor_name = "Anonymous"
    if getattr(donation, "donor", None):
        donor_name = getattr(donation.donor, "donor_name", donor_name) or donor_name

    donor_email = "N/A"
    if getattr(donation, "donor", None) and getattr(donation.donor, "user", None):
        donor_email = getattr(donation.donor.user, "email", donor_email) or donor_email

    story.append(Paragraph(f"<b>Donor:</b> {donor_name}", normal))
    story.append(Paragraph(f"<b>Email:</b> {donor_email}", normal))
    story.append(Spacer(1, 0.2 * inch))

    # Donation Details
    story.append(Paragraph("Donation Details", h3_style))
    story.append(Spacer(1, 0.1 * inch))

    donation_id = getattr(donation, "donation_id", "N/A")
    story.append(Paragraph(f"<b>Donation ID:</b> {donation_id}", normal))

    # Format date safely
    donation_date = getattr(donation, "donation_date", None)
    date_str = "N/A"
    try:
        if donation_date:
            # avoid using %Z which may be empty — stick to ISO-like format
            date_str = donation_date.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        date_str = str(donation_date)

    story.append(Paragraph(f"<b>Date:</b> {date_str}", normal))

    # Amount / type handling
    donation_type = getattr(donation, "donation_type", None)
    # Assuming DonationType.CASH / DonationType.INKIND etc.
    if donation_type is not None and getattr(donation, "cash", None) and getattr(donation, "cash").amount is not None:
        amt = _safe_amount(getattr(donation.cash, "amount", None))
        payment_method = getattr(donation.cash, "payment_method", None) or "N/A"
        story.append(Paragraph(f"<b>Amount:</b> PHP {amt}", normal))
        story.append(Paragraph(f"<b>Payment Method:</b> {payment_method}", normal))
    elif donation_type is not None and getattr(donation, "inkind", None):
        item_desc = getattr(donation.inkind, "item_description", None) or "N/A"
        est_val = _safe_amount(getattr(donation.inkind, "estimated_value", None))
        story.append(Paragraph(f"<b>Type:</b> In-Kind", normal))
        story.append(Paragraph(f"<b>Item(s):</b> {item_desc}", normal))
        story.append(Paragraph(f"<b>Estimated Value:</b> PHP {est_val}", normal))
    else:
        # fallback if structure not as expected
        story.append(Paragraph("<b>Amount:</b> N/A", normal))

    # Optional payment processor reference
    checkout_id = getattr(donation, "checkout_id", None)
    if checkout_id:
        story.append(Paragraph(f"<b>PayMongo Reference:</b> {checkout_id}", normal))

    story.append(Spacer(1, 0.4 * inch))

    # Thank you
    story.append(Paragraph("Thank you for your generous donation!", h2_style))
    story.append(Paragraph("Your support helps us continue our mission. We are incredibly grateful for your contribution.", normal))

    # Build PDF in try/except so we can log issues and return meaningful output
    try:
        doc.build(story)
    except Exception as e:
        # If building fails, write a minimal error PDF so the response is a valid PDF
        # (This helps debugging instead of returning empty/corrupt bytes.)
        from reportlab.pdfgen import canvas

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(72, 750, "Receipt generation failed")
        c.setFont("Helvetica", 10)
        c.drawString(72, 730, f"Error: {str(e)}")
        c.drawString(72, 710, "Please check server logs for full traceback.")
        c.showPage()
        c.save()

    buffer.seek(0)
    return buffer