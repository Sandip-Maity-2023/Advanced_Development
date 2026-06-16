# #document_processor.py
# from PyPDF2 import PdfReader
# from pathlib import Path

# def extract_pdf_text(file_path):
#     pdf = PdfReader(file_path)

#     text = ""

#     for page in pdf.pages:
#         content = page.extract_text()
#         if content:
#             text += content + "\n"

#     return text

from PyPDF2 import PdfReader


def extract_pdf_text(file_path):
    try:
        pdf = PdfReader(file_path)

        text_parts = []

        for page in pdf.pages:
            try:
                content = page.extract_text()

                if content and content.strip():
                    text_parts.append(content)

            except Exception:
                continue

        return "\n".join(text_parts)

    except Exception as e:
        raise RuntimeError(
            f"Failed to process PDF: {str(e)}"
        )