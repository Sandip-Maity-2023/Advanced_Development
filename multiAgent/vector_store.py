# #vector_store.py
# import os
# from dotenv import load_dotenv
# import streamlit as st

# load_dotenv()

# vector_store = None

# @st.cache_resource
# def get_vector_store():
#     global vector_store

#     if vector_store is not None:
#         return vector_store

    
#     # Read from local .env OR Streamlit Cloud Secrets
#     token = (
#         os.getenv("ASTRA_DB_APPLICATION_TOKEN")
#         or st.secrets.get("ASTRA_DB_APPLICATION_TOKEN")
#     )

#     database_id = (
#         os.getenv("ASTRA_DB_ID")
#         or os.getenv("ASTRA_DB_DATABASE_ID")
#         or st.secrets.get("ASTRA_DB_ID")
#         or st.secrets.get("ASTRA_DB_DATABASE_ID")
#     )

#     gemini_api_key = (
#         os.getenv("GEMINI_API_KEY")
#         or os.getenv("GOOGLE_API_KEY")
#         or st.secrets.get("GEMINI_API_KEY")
#         or st.secrets.get("GOOGLE_API_KEY")
#     )

#     missing = [
#         name
#         for name, value in {
#             "ASTRA_DB_APPLICATION_TOKEN": token,
#             "ASTRA_DB_ID": database_id,
#             "GEMINI_API_KEY": gemini_api_key,
#         }.items()
#         if not value
#     ]

#     if missing:
#         raise RuntimeError(
#             f"Missing environment variables: {', '.join(missing)}"
#         )

#     try:
#         from gevent import monkey
#         monkey.patch_all()
#     except ImportError:
#         pass

#     import cassio
#     from langchain_community.vectorstores import Cassandra
#     from langchain_google_genai import GoogleGenerativeAIEmbeddings

#     cassio.init(
#         token=token,
#         database_id=database_id,
#     )

#     embeddings = GoogleGenerativeAIEmbeddings(
#         model="models/gemini-embedding-001",
#         google_api_key=gemini_api_key,
#     )

#     vector_store = Cassandra(
#         embedding=embeddings,
#         table_name="researchmind_documents",
#         session=None,
#         keyspace=None,
#     )

#     return vector_store



# vector_store.py

import os
from dotenv import load_dotenv
import streamlit as st

load_dotenv()


def _get_secret(key: str):
    """Safely read Streamlit secrets."""
    try:
        return st.secrets[key]
    except Exception:
        return None


@st.cache_resource
def get_vector_store():
    """
    Initialize and cache AstraDB vector store.
    """

    token = (
        os.getenv("ASTRA_DB_APPLICATION_TOKEN")
        or _get_secret("ASTRA_DB_APPLICATION_TOKEN")
    )

    database_id = (
        os.getenv("ASTRA_DB_ID")
        or os.getenv("ASTRA_DB_DATABASE_ID")
        or _get_secret("ASTRA_DB_ID")
        or _get_secret("ASTRA_DB_DATABASE_ID")
    )

    gemini_api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or _get_secret("GEMINI_API_KEY")
        or _get_secret("GOOGLE_API_KEY")
    )

    missing = []

    if not token:
        missing.append("ASTRA_DB_APPLICATION_TOKEN")

    if not database_id:
        missing.append("ASTRA_DB_ID")

    if not gemini_api_key:
        missing.append("GEMINI_API_KEY")

    if missing:
        raise RuntimeError(
            f"Missing configuration: {', '.join(missing)}"
        )

    try:
        from gevent import monkey
        monkey.patch_all()
    except Exception:
        pass

    import cassio
    from langchain_community.vectorstores import Cassandra
    from langchain_google_genai import (
        GoogleGenerativeAIEmbeddings,
    )

    cassio.init(
        token=token,
        database_id=database_id,
    )

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=gemini_api_key,
    )

    vector_store = Cassandra(
        embedding=embeddings,
        table_name="researchmind_documents",
        session=None,
        keyspace=None,
    )

    return vector_store