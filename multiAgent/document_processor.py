#document_processor.py
from PyPDF2 import PdfReader
from pathlib import Path

def extract_pdf_text(file_path):
    pdf = PdfReader(file_path)

    text = ""

    for page in pdf.pages:
        content = page.extract_text()
        if content:
            text += content + "\n"

    return text

