# This file is the configuration layer of your project. It sets up:

# Gemini LLM
# Search Agent
# Reader Agent
# Writer Chain
# Critic Chain
# Think of it as the file that creates all the AI workers used by your research pipeline.

# Topic
#  ↓
# Search Agent
#  ↓
# web_search()
#  ↓
# Search Results
#  ↓
# Reader Agent
#  ↓
# scrape_url()
#  ↓
# Article Content
#  ↓
# Writer Chain
#  ↓
# Research Report
#  ↓
# Critic Chain
#  ↓
# Review & Score


# agents.py
from langchain.agents import create_agent #Creates AI agents that can use tools
from langchain_google_genai import ChatGoogleGenerativeAI  #Connects LangChain to Gemini.
from langchain_core.prompts import ChatPromptTemplate      #Used to create prompts with variables.
from langchain_core.output_parsers import StrOutputParser  #Converts model output into a plain string
from tools import web_search, scrape_url
from dotenv import load_dotenv
import os

load_dotenv()

# Gemini Configuration
DEFAULT_MODEL = "gemini-2.5-flash"
SUPPORTED_MODELS = {
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-1.5-flash"
}

# This function checks for the Gemini API key in environment variables or secrets and raises an error if it's missing.
def get_api_key():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if api_key:
        return api_key

    raise RuntimeError(
        "Missing GEMINI_API_KEY or GOOGLE_API_KEY."
    )


gemini_api_key = get_api_key()
requested_model = os.getenv("GEMINI_MODEL", "").strip()
model_name = (
    requested_model
    if requested_model in SUPPORTED_MODELS
    else DEFAULT_MODEL
)

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model=model_name,
    temperature=0,
    google_api_key=gemini_api_key
)


# Search Agent
def build_search_agent():
    return create_agent(
        model=llm,
        tools=[web_search]
    )



# Reader Agent
def build_reader_agent():
    return create_agent(
        model=llm,
        tools=[scrape_url]
    )


# Writer Chain
writer_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert research writer. Write clear, structured and insightful reports."
    ),
    (
        "human",
        """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""
    ),
])

writer_chain = writer_prompt | llm | StrOutputParser()



# Critic Chain

critic_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a sharp and constructive research critic. Be honest and specific."
    ),
    (
        "human",
        """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""
    ),
])

critic_chain = critic_prompt | llm | StrOutputParser() #This is a LangChain Expression Language (LCEL) pipeline.

# All of these stages use the same Gemini model instance (llm), but each stage has a different responsibility, different prompt, and different tool access. That's why it behaves like multiple specialized workers even though there is only one underlying Gemini model.
