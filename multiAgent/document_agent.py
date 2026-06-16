import streamlit as st
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=st.secrets["GEMINI_API_KEY"]
)

def extract_text(uploaded_file):
    if uploaded_file.name.endswith(".txt"):
        return uploaded_file.read().decode("utf-8")

    if uploaded_file.name.endswith(".pdf"):
        reader = PdfReader(uploaded_file)
        text = ""

        for page in reader.pages:
            text += page.extract_text() + "\n"

        return text

    return ""

st.title("Document Q&A")

uploaded_file = st.file_uploader(
    "Upload PDF or TXT",
    type=["pdf", "txt"]
)

question = st.text_input("Ask a question")

if uploaded_file and question:

    document_text = extract_text(uploaded_file)

    prompt = f"""
    Use only the document below.

    DOCUMENT:
    {document_text}

    QUESTION:
    {question}
    """

    response = llm.invoke(prompt)

    st.write(response.content)
    