import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
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

def generate_donation_receipt(donation: Donation) -> io.BytesIO:
    """
    Generates a PDF receipt for a given donation and returns it as an in-memory buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    story = []

    # Title
    story.append(Paragraph("Donation Receipt", styles['h1']))
    story.append(Spacer(1, 0.25 * inch))

    # Donor Information
    donor_name = donation.donor.donor_name
    donor_email = getattr(donation.donor.user, 'email', 'N/A')
    
    story.append(Paragraph(f"<b>Donor:</b> {donor_name}", styles['Normal']))
    story.append(Paragraph(f"<b>Email:</b> {donor_email}", styles['Normal']))
    story.append(Spacer(1, 0.2 * inch))

    # Donation Details
    story.append(Paragraph("<u>Donation Details</u>", styles['h3']))
    story.append(Spacer(1, 0.1 * inch))
    
    story.append(Paragraph(f"<b>Donation ID:</b> {donation.donation_id}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {donation.donation_date.strftime('%Y-%m-%d %H:%M:%S %Z')}", styles['Normal']))
    
    if donation.donation_type == DonationType.CASH and donation.cash:
        story.append(Paragraph(f"<b>Amount:</b> PHP {donation.cash.amount:.2f}", styles['Normal']))
        story.append(Paragraph(f"<b>Payment Method:</b> {donation.cash.payment_method or 'N/A'}", styles['Normal']))
    elif donation.donation_type == DonationType.INKIND and donation.inkind:
        story.append(Paragraph(f"<b>Type:</b> In-Kind", styles['Normal']))
        story.append(Paragraph(f"<b>Item(s):</b> {donation.inkind.item_description or 'N/A'}", styles['Normal']))
        story.append(Paragraph(f"<b>Estimated Value:</b> PHP {donation.inkind.estimated_value:.2f}", styles['Normal']))
        
    if donation.checkout_id:
        story.append(Paragraph(f"<b>PayMongo Reference:</b> {donation.checkout_id}", styles['Normal']))

    story.append(Spacer(1, 0.4 * inch))

    # Thank you message
    story.append(Paragraph("Thank you for your generous donation!", styles['h2']))
    story.append(Paragraph("Your support helps us continue our mission. We are incredibly grateful for your contribution.", styles['Normal']))

    doc.build(story)
    
    buffer.seek(0)
    return buffer