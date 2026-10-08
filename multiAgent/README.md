# MultiAgent ResearchMind

MultiAgent ResearchMind is an AI-assisted research application built with
Streamlit, LangChain, and Google Gemini. It accepts a research topic, searches
for sources, reads a selected web page, drafts a structured report, and asks a
separate critic chain to evaluate the result. The Streamlit interface presents
each stage and allows the final report to be downloaded.

The repository also contains an experimental document Q&A module and vector
store integration for future or optional document-based research workflows.

## Research pipeline

```text
Topic
  ↓
Search Agent ── web_search() via Tavily
  ↓
Reader Agent ── scrape_url() via requests + BeautifulSoup
  ↓
Writer Chain ── structured report from Gemini
  ↓
Critic Chain ── score, strengths, and improvement suggestions
```

## Features

- Streamlit research dashboard with a dark, custom-styled interface.
- Search agent that returns up to five titles, URLs, and snippets.
- Reader agent that selects and scrapes a relevant source.
- Writer chain that produces:
  - Introduction
  - At least three key findings
  - Conclusion
  - Source URLs
- Critic chain with a score out of ten, strengths, improvement areas, and a
  one-line verdict.
- Raw search results and scraped content shown in expandable panels.
- Downloadable report output.
- Supported Gemini models:
  `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro`, and
  `gemini-1.5-flash`.
- Optional PDF/TXT document Q&A in `document_agent.py`.
- Optional Astra DB/Cassandra vector store in `vector_store.py`.

## Technology

- Python 3.10+
- Streamlit
- LangChain and LangChain Core
- LangChain Google GenAI integration
- Google Gemini
- Tavily Search
- Requests and BeautifulSoup
- Optional Astra DB/Cassandra vector store
- PyPDF for document extraction

## Project structure

```text
multiAgent/
├── app.py                 # Streamlit ResearchMind UI
├── agents.py              # Gemini model, agents, writer, and critic chains
├── pipeline.py            # Sequential research pipeline
├── tools.py               # Tavily search and web scraping tools
├── document_agent.py      # Experimental PDF/TXT document Q&A app
├── document_processor.py  # PDF extraction helper
├── vector_store.py        # Optional Astra DB vector-store setup
├── requirements.txt
├── run_app.bat            # Windows launcher for the virtual environment
└── README.md
```

## Requirements

- Python 3.10 or newer
- A Gemini API key
- A Tavily API key
- Internet access for web search and source scraping
- Astra DB credentials only when using the optional vector-store code

## Installation

Create the virtual environment and install dependencies:

```powershell
cd E:\Advanced_Development\multiAgent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Set the required environment variables in a local `.env` file:

```env
GEMINI_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key
GEMINI_MODEL=gemini-2.5-flash
```

`GOOGLE_API_KEY` can be used as an alternative to `GEMINI_API_KEY`. The
application validates the Gemini key before creating the agents. Do not commit
`.env`, API keys, or Streamlit secrets.

## Run the Streamlit application

From the project root:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Or use the Windows launcher:

```powershell
.\run_app.bat
```

Open the local URL printed by Streamlit, normally `http://localhost:8501`.
Enter a topic and select **Run Research Pipeline**. The UI reports search,
reading, writing, and critique progress before displaying the final report.

## Run the pipeline from the command line

```powershell
.\.venv\Scripts\python.exe pipeline.py
```

Enter a topic when prompted. `run_research_pipeline(topic)` returns a
dictionary containing:

```text
search_results
scraped_content
report
feedback
```

## Optional document Q&A

`document_agent.py` is a separate Streamlit entry point that accepts a PDF or
TXT upload and answers a question using only the extracted document text:

```powershell
.\.venv\Scripts\python.exe -m streamlit run document_agent.py
```

This module reads `GEMINI_API_KEY` from Streamlit secrets, so configure
`.streamlit/secrets.toml` or adapt it to use the same environment-variable
pattern as `agents.py` before running it.

## Optional vector store

`vector_store.py` creates a cached Astra DB/Cassandra vector store using Gemini
embeddings. It expects:

```env
ASTRA_DB_APPLICATION_TOKEN=your_astra_token
ASTRA_DB_ID=your_database_id
GEMINI_API_KEY=your_gemini_key
```

The vector store is initialized lazily through `get_vector_store()` and uses
the `researchmind_documents` table. The current main research flow uses live
web search and does not require Astra DB.

## Pipeline behavior and limitations

- Search results depend on Tavily availability and current web content.
- The reader currently returns a limited amount of cleaned page text; dynamic
  or blocked sites may not scrape successfully.
- Generated reports should be checked against the cited sources before use.
- The application uses one Gemini model instance with different prompts and
  tool access to represent specialized workers.
- No source content or reports are persisted by the Streamlit app between
  sessions unless you add storage.
- Keep API credentials server-side and use rate limits for a public deployment.

## Deployment

For Streamlit hosting, configure `GEMINI_API_KEY`, `TAVILY_API_KEY`, and
optionally `GEMINI_MODEL` as secrets/environment variables. Install from
`requirements.txt`, then use:

```text
streamlit run app.py
```

Never copy API keys from historical setup notes into source control.
