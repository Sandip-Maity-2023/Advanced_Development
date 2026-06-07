
import os
from dotenv import load_dotenv
from langchain_community.vectorstores import Cassandra
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

vector_store = None

def get_vector_store():
    global vector_store

    if vector_store is not None:
        return vector_store

    token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
    database_id = os.getenv("ASTRA_DB_ID") or os.getenv("ASTRA_DB_DATABASE_ID")
    gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    missing = [
        name
        for name, value in {
            "ASTRA_DB_APPLICATION_TOKEN": token,
            "ASTRA_DB_ID or ASTRA_DB_DATABASE_ID": database_id,
            "GEMINI_API_KEY or GOOGLE_API_KEY": gemini_api_key,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError("Missing environment variables: " + ", ".join(missing))

    try:
        from gevent import monkey

        monkey.patch_socket()
    except ImportError:
        pass

    import cassio

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
