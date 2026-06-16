# #document_agent.py
# from langchain.tools import tool
# from vector_store import get_vector_store

# @tool
# def search_documents(query: str) -> str:
#     """
#     Search uploaded documents and return relevant content.
#     """

#     vector_store = get_vector_store()

#     docs = vector_store.similarity_search(
#         query,
#         k=5
#     )

#     if not docs:
#         return "No matching uploaded document content was found."

#     results = []

#     for doc in docs:

#         source = doc.metadata.get(
#             "source",
#             "unknown"
#         )

#         results.append(
#             f"Source: {source}\n"
#             f"{doc.page_content[:1000]}"
#         )

#     return "\n\n---\n\n".join(results)


from langchain.tools import tool
from vector_store import get_vector_store


@tool
def search_documents(query: str) -> str:
    """
    Search uploaded documents and return relevant content.
    """

    try:
        vector_store = get_vector_store()

        docs = vector_store.similarity_search(
            query,
            k=5
        )

        if not docs:
            return (
                "No matching uploaded document "
                "content was found."
            )

        results = []

        for doc in docs:

            source = doc.metadata.get(
                "source",
                "unknown"
            )

            results.append(
                f"Source: {source}\n"
                f"{doc.page_content[:1000]}"
            )

        return "\n\n---\n\n".join(results)

    except Exception as e:
        return (
            f"Document retrieval failed: "
            f"{str(e)}"
        )