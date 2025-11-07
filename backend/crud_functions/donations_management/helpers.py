from datetime import datetime, timezone
from uuid import uuid4
from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

# Optional (so this works outside FastAPI too)
try:
    from fastapi import HTTPException
except Exception:
    HTTPException = None  # fallback: don't raise HTTPException if not in FastAPI

UPLOAD_DIR = Path("media/finance_donation_receipts")  # your specified path

def make_aware(dt):
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

def process_image_to_webp(file_like) -> bytes:
    """
    Convert an image (file-like or bytes) to WEBP (lossless) and return bytes.
    Requires Pillow (PIL).
    """
    import io
    from PIL import Image

    if hasattr(file_like, "read"):
        raw = file_like.read()
    elif isinstance(file_like, (bytes, bytearray)):
        raw = bytes(file_like)
    else:
        raise ValueError("Unsupported image input; must be file-like or bytes.")

    with Image.open(io.BytesIO(raw)) as im:
        im = im.convert("RGBA") if im.mode in ("LA", "P") else im.convert("RGB")
        out = io.BytesIO()
        im.save(out, format="WEBP", lossless=True)
        return out.getvalue()

def generate_donation_receipt(donation_details: dict, image=None) -> str:
    """
    Generates a styled PDF donation receipt and saves it under UPLOAD_DIR.
    If `image` is provided (UploadFile / file-like / bytes), it's saved as .webp
    into UPLOAD_DIR/logos and used as the logo if donation_details['logo_path'] is not set.
    Returns the absolute path to the saved PDF.
    """
    import os
    import uuid

    # ---------- helpers ----------
    def fmt_amount(a):
        try:
            return f"PHP {float(a):,.2f}"
        except Exception:
            return f"PHP {a}"

    def draw_label_value(c, x, y, label, value, label_color=colors.HexColor("#5B5B5B")):
        c.setFont("Helvetica", 9)
        c.setFillColor(label_color)
        c.drawString(x, y, label)
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.black)
        c.drawString(x, y - 14, value if value else "—")

    def draw_hr(c, x1, x2, y, stroke_color=colors.HexColor("#E6E6E6")):
        c.setStrokeColor(stroke_color)
        c.setLineWidth(1)
        c.line(x1, y, x2, y)

    # ---------- ensure directories ----------
    receipts_dir = UPLOAD_DIR  # use your specified path for receipts
    logos_dir = UPLOAD_DIR / "logos"
    receipts_dir.mkdir(parents=True, exist_ok=True)
    logos_dir.mkdir(parents=True, exist_ok=True)

    # ---------- optional image upload (save as .webp and use as logo if none provided) ----------
    if image is not None and getattr(image, "filename", None):
        try:
            ext = Path(image.filename).suffix or ".webp"
            unique_name = f"{uuid4().hex}{ext}"
            target_path = (logos_dir / unique_name).with_suffix(".webp")
            processed = process_image_to_webp(image)
            with target_path.open("wb") as buf:
                buf.write(processed)
            # If no logo provided, use the uploaded one
            donation_details.setdefault("logo_path", str(target_path))
        except Exception as e:
            print(f"Error saving logo: {e}")
            if HTTPException:
                raise HTTPException(status_code=500, detail="Error saving uploaded image")

    # ---------- build PDF path ----------
    pdf_path = receipts_dir / f"{uuid.uuid4()}.pdf"

    # ---------- page + canvas ----------
    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    width, height = letter

    # ---------- brand header band ----------
    brand_color = colors.HexColor("#2E7D32")  # deep green accent
    light_tint = colors.HexColor("#F6FBF6")

    header_h = 1.35 * inch
    c.setFillColor(brand_color)
    c.rect(0, height - header_h, width, header_h, fill=1, stroke=0)

    # Optional logo
    logo_w = 1.1 * inch
    logo_h = 1.1 * inch
    logo_x = 0.75 * inch
    logo_y = height - header_h + (header_h - logo_h) / 2
    logo_path = donation_details.get("logo_path")
    if logo_path and os.path.exists(logo_path):
        try:
            c.drawImage(ImageReader(logo_path), logo_x, logo_y, width=logo_w, height=logo_h,
                        preserveAspectRatio=True, mask='auto')
        except Exception:
            # ignore logo errors silently
            pass

    # Org name + receipt title
    org_name = donation_details.get("organization_name", "RAFI - IDRIS")
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(logo_x + logo_w + 0.45 * inch, height - 0.55 * inch, org_name)

    c.setFont("Helvetica", 11)
    c.drawString(logo_x + logo_w + 0.45 * inch, height - 0.90 * inch, "Official Donation Receipt")

    # Receipt ID pill
    donation_id = donation_details.get("donation_id", "N/A")
    pill_text = f"Receipt ID: {donation_id}"
    pill_w = c.stringWidth(pill_text, "Helvetica-Bold", 10) + 18
    pill_h = 16
    pill_x = width - pill_w - 0.75 * inch
    pill_y = height - 0.80 * inch
    c.setFillColor(colors.white)
    c.roundRect(pill_x, pill_y, pill_w, pill_h, 8, fill=1, stroke=0)
    c.setFillColor(brand_color)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(pill_x + pill_w / 2, pill_y + 4, pill_text)

    # ---------- details card ----------
    card_x = 0.75 * inch
    card_y = height - header_h - 0.5 * inch
    card_w = width - 1.5 * inch
    card_h = 3.0 * inch

    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor("#E3E8E1"))
    c.setLineWidth(1)
    c.roundRect(card_x, card_y - card_h, card_w, card_h, 12, fill=1, stroke=1)

    # Section header
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(card_x + 18, card_y - 24, "Donation Details")
    draw_hr(c, card_x + 16, card_x + card_w - 16, card_y - 28, stroke_color=colors.HexColor("#EDF2EC"))

    # Left column
    left_x = card_x + 18
    top_y = card_y - 48
    draw_label_value(c, left_x, top_y, "Donor Name", donation_details.get("donor_name", "N/A"))
    draw_label_value(c, left_x, top_y - 40, "Date", donation_details.get("date", "N/A"))
    draw_label_value(c, left_x, top_y - 80, "Purpose", donation_details.get("purpose", "General Donation"))

    # Right column
    right_x = card_x + card_w / 2
    draw_label_value(c, right_x, top_y, "Amount", fmt_amount(donation_details.get("amount", "0.00")))
    # To include these again, uncomment:
    # draw_label_value(c, right_x, top_y - 40, "Payment Method", donation_details.get("payment_method", "N/A"))
    # draw_label_value(c, right_x, top_y - 80, "Reference", donation_details.get("reference", "N/A"))

    # Highlight amount band
    amt_band_y = card_y - card_h + 26
    c.setFillColor(light_tint)
    c.roundRect(card_x + 12, amt_band_y, card_w - 24, 32, 8, fill=1, stroke=0)
    c.setFillColor(brand_color)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(card_x + card_w / 2, amt_band_y + 10,
                        f"Received: {fmt_amount(donation_details.get('amount', '0.00'))}")

    # ---------- QR verification (optional) ----------
    verification_url = donation_details.get("verification_url")
    if verification_url:
        try:
            qr_code = qr.QrCodeWidget(verification_url)
            bounds = qr_code.getBounds()
            size = 1.3 * inch
            w = bounds[2] - bounds[0]
            h = bounds[3] - bounds[1]
            d = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
            d.add(qr_code)
            renderPDF.draw(d, c, width - size - 0.75 * inch, card_y - card_h - size + 10)
            c.setFont("Helvetica", 8)
            c.setFillColor(colors.HexColor("#5B5B5B"))
            c.drawRightString(width - 0.75 * inch, card_y - card_h - size - 2, "Scan to verify")
        except Exception:
            pass

    # ---------- thank-you + org info ----------
    thanks_y = card_y - card_h - 0.55 * inch
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.black)
    c.drawString(card_x, thanks_y, "Thank you for your generous support!")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#5B5B5B"))
    org_lines = []
    if donation_details.get("organization_address"):
        org_lines.append(donation_details["organization_address"])
    if donation_details.get("organization_phone"):
        org_lines.append(f"Phone: {donation_details['organization_phone']}")
    if donation_details.get("organization_email"):
        org_lines.append(f"Email: {donation_details['organization_email']}")

    # footer baseline
    footer_y = 0.9 * inch
    draw_hr(c, 0.75 * inch, width - 0.75 * inch, footer_y + 8)

    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#5B5B5B"))
    c.drawString(0.75 * inch, footer_y - 2,
                 "This receipt serves as an official acknowledgment of your donation.")
    if org_lines:
        c.drawRightString(width - 0.75 * inch, footer_y - 2, " • ".join(org_lines))

    # Small compliance note
    c.setFont("Helvetica-Oblique", 7.5)
    c.setFillColor(colors.HexColor("#8A8A8A"))
    c.drawCentredString(width / 2, 0.55 * inch,
                        "No goods or services were provided in exchange for this contribution.")

    c.showPage()
    c.save()

    return str(pdf_path)
