from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm


def make_pdf_from_text(text: str) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    margin_x = 2 * cm
    margin_y = 2 * cm
    max_width = width - 2 * margin_x

    text_object = c.beginText()
    text_object.setTextOrigin(margin_x, height - margin_y)
    text_object.setFont("Times-Roman", 11)

    # Basic wrap: split into lines that fit page width roughly
    for paragraph in (text or "").splitlines() or [""]:
        line = ""
        for word in paragraph.split(" "):
            test_line = (line + (" " if line else "") + word).strip()
            if c.stringWidth(test_line, "Times-Roman", 11) <= max_width:
                line = test_line
            else:
                text_object.textLine(line)
                line = word
        text_object.textLine(line)
        text_object.textLine("")

    c.drawText(text_object)
    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer
