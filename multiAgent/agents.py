# # A Search Agent → searches the web.
# # A Reader Agent → extracts content from URLs.
# # A Writer Chain → writes a research report.
# # A Critic Chain → evaluates the report.

# from langchain.agents import create_agent
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser #Converts LLM output into plain text.
# from tools import web_search , scrape_url #web_search → searches the web, scrape_url → reads webpage content
# from dotenv import load_dotenv # Loads environment variables from .env
# import os

# load_dotenv() #read values from .env file

# # Gemini model setup
# DEFAULT_MODEL = "gemini-2.5-flash"
# SUPPORTED_MODELS = {
#     "gemini-2.5-flash",
#     "gemini-2.5-flash-lite",
#     "gemini-2.5-pro",
#     "gemini-1.5-flash",
# }

# requested_model = os.getenv("GEMINI_MODEL", "").strip()  #Read Model from Environment

# model_name = requested_model if requested_model in SUPPORTED_MODELS else DEFAULT_MODEL
# gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# if not gemini_api_key:
#     raise RuntimeError("Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment.")

# llm = ChatGoogleGenerativeAI(
#     model=model_name,
#     temperature=0,
#     google_api_key=gemini_api_key,
# )

# #temperature=0
# #Makes responses: deterministic factual less creative Good for research

# def response_to_text(content) -> str:
#     """Convert LangChain/Gemini message content blocks into displayable text."""
#     if isinstance(content, str):
#         return content            
# # Gemini often returns structured content blocks.--This function standardizes output.

#     if isinstance(content, list):
#         parts = []
#         for item in content:
#             if isinstance(item, str):
#                 parts.append(item)
#             elif isinstance(item, dict):
#                 text = item.get("text") or item.get("content")
#                 if text:
#                     parts.append(str(text))
#             elif item is not None:
#                 parts.append(str(item))
#         return "\n".join(parts).strip()

#     if isinstance(content, dict):
#         return str(content.get("text") or content.get("content") or content)

#     return "" if content is None else str(content)

# # Agent can:
# # Receive a query
# # Decide when to use web_search
# # Analyze results
# # Return findings

# #1st agent 
# def build_search_agent():
#     return create_agent(
#         model = llm,
#         tools= [web_search]
#     )

# #2nd agent 
# def build_reader_agent():
#     return create_agent(
#         model = llm,
#         tools = [scrape_url]
#     )


# #writer chain 
# writer_prompt = ChatPromptTemplate.from_messages([
#     ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
#     ("human", """Write a detailed research report on the topic below.

# Topic: {topic}

# Research Gathered:
# {research}

# Structure the report as:
# - Introduction
# - Key Findings (minimum 3 well-explained points)
# - Conclusion
# - Sources (list all URLs found in the research)

# Be detailed, factual and professional."""),
# ])

# writer_chain = writer_prompt | llm | StrOutputParser()

# #critic_chain 

# critic_prompt = ChatPromptTemplate.from_messages([
#      ("system", "You are a sharp and constructive research critic. Be honest and specific."),
#     ("human", """Review the research report below and evaluate it strictly.

# Report:
# {report}     

#       The generated report is passed here.

# Respond in this exact format:

# Score: X/10

# Strengths:
# - ...
# - ...

# Areas to Improve:
# - ...
# - ...

# One line verdict:
# ..."""),
# ])

# critic_chain = critic_prompt | llm | StrOutputParser()


# #This architecture is a common agentic research pipeline where agents gather information, a writer synthesizes it into a report, and a critic performs quality control.


# from document_agent import search_documents

# # Document Agent

# def build_document_agent():
#     from document_agent import search_documents

#     return create_agent(
#         model=llm,
#         tools=[search_documents]
#     )




# agents.py

import os
from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from tools import web_search, scrape_url


# ---------------------------------------------------
# Load Environment Variables
# ---------------------------------------------------

load_dotenv()

# Optional Streamlit support
try:
    import streamlit as st

    STREAMLIT_AVAILABLE = True
except ImportError:
    STREAMLIT_AVAILABLE = False

def get_secret(key):
    try:
        return st.secrets[key]
    except Exception:
        return None
# ---------------------------------------------------
# Gemini Model Configuration
# ---------------------------------------------------

DEFAULT_MODEL = "gemini-2.5-flash"

SUPPORTED_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
}


def get_api_key():
    """
    Fetch Gemini API key from:
    1. Environment Variables
    2. Streamlit Secrets
    """

    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )

    if api_key:
        return api_key

    if STREAMLIT_AVAILABLE:
       api_key = (
        get_secret("GEMINI_API_KEY")
        or get_secret("GOOGLE_API_KEY")
    )

       if api_key:
        return api_key

    raise RuntimeError(
        "Missing GEMINI_API_KEY or GOOGLE_API_KEY.\n"
        "Add it to your .env file (local) or Streamlit Secrets (cloud)."
    )


gemini_api_key = get_api_key()

requested_model = os.getenv("GEMINI_MODEL", "").strip()

model_name = (
    requested_model
    if requested_model in SUPPORTED_MODELS
    else DEFAULT_MODEL
)


# ---------------------------------------------------
# LLM Initialization
# ---------------------------------------------------

llm = ChatGoogleGenerativeAI(
    model=model_name,
    temperature=0,
    google_api_key=gemini_api_key,
)


# ---------------------------------------------------
# Utility Function
# ---------------------------------------------------

def response_to_text(content) -> str:
    """
    Convert Gemini/LangChain responses into plain text.
    """

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, str):
                parts.append(item)

            elif isinstance(item, dict):
                text = item.get("text") or item.get("content")

                if text:
                    parts.append(str(text))

            elif item is not None:
                parts.append(str(item))

        return "\n".join(parts).strip()

    if isinstance(content, dict):
        return str(
            content.get("text")
            or content.get("content")
            or content
        )

    return "" if content is None else str(content)


# ---------------------------------------------------
# Search Agent
# ---------------------------------------------------
if STREAMLIT_AVAILABLE:
    @st.cache_resource
    def build_search_agent():
        return create_agent(
            model=llm,
            tools=[web_search],
        )
else:
    def build_search_agent():
        return create_agent(
            model=llm,
            tools=[web_search],
        )


# ---------------------------------------------------
# Reader Agent
# ---------------------------------------------------

if STREAMLIT_AVAILABLE:
    @st.cache_resource
    def build_reader_agent():
        return create_agent(
            model=llm,
            tools=[scrape_url],
        )
else:
    def build_reader_agent():
        return create_agent(
            model=llm,
            tools=[scrape_url],
        )


# ---------------------------------------------------
# Document Agent
# ---------------------------------------------------

if STREAMLIT_AVAILABLE:
    @st.cache_resource
    def build_document_agent():

        from document_agent import search_documents

        return create_agent(
            model=llm,
            tools=[search_documents],
        )
else:
    def build_document_agent():

        from document_agent import search_documents

        return create_agent(
            model=llm,
            tools=[search_documents],
        )


# ---------------------------------------------------
# Writer Chain
# ---------------------------------------------------

writer_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert research writer. "
            "Write clear, structured and insightful reports.",
        ),
        (
            "human",
            """
Write a detailed research report on the topic below.

Topic:
{topic}

Research Gathered:
{research}

Structure the report as:

1. Introduction

2. Key Findings
   - Minimum 3 detailed findings

3. Conclusion

4. Sources
   - List all URLs found in the research

Be factual, professional and detailed.
""",
        ),
    ]
)

writer_chain = (
    writer_prompt
    | llm
    | StrOutputParser()
)


# ---------------------------------------------------
# Critic Chain
# ---------------------------------------------------

critic_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a strict and constructive research critic.",
        ),
        (
            "human",
            """
Review the report below.

Report:
{report}

Respond EXACTLY in this format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
...
""",
        ),
    ]
)

critic_chain = (
    critic_prompt
    | llm
    | StrOutputParser()
)
