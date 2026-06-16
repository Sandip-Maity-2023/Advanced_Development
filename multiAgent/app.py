#app.py
import html
import re
import time
from pathlib import Path

import streamlit as st
from langchain_text_splitters import RecursiveCharacterTextSplitter

from agents import (
    build_document_agent,
    build_reader_agent,
    build_search_agent,
    critic_chain,
    llm,
    response_to_text,
    writer_chain,
)
from document_processor import extract_pdf_text
from vector_store import get_vector_store


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


QUOTA_MARKERS = ("RESOURCE_EXHAUSTED", "429", "quota", "rate-limit", "rate limit")
TRANSIENT_MARKERS = (
    "Connection aborted",
    "RemoteDisconnected",
    "temporarily unavailable",
    "timeout",
    "timed out",
    "503",
    "504",
)


st.set_page_config(
    page_title="ResearchMind - Gemini Multi-Agent Research",
    page_icon="AI",
    layout="wide",
    initial_sidebar_state="expanded",
)


st.markdown(
    """
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap');

html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
    color: #ece8df;
}
.stApp {
    background:
        radial-gradient(ellipse 70% 45% at 18% -10%, rgba(255, 140, 50, 0.12), transparent 60%),
        radial-gradient(ellipse 45% 35% at 85% 110%, rgba(57, 183, 142, 0.08), transparent 58%),
        #090a0f;
}
#MainMenu, footer, header { visibility: hidden; }
.block-container { max-width: 1240px; padding: 2rem 3rem 4rem; }
.hero { padding: 2.5rem 0 1.5rem; }
.hero-kicker {
    color: #ff8c32;
    font: 500 0.72rem 'DM Mono', monospace;
    letter-spacing: 0.22em;
    text-transform: uppercase;
}
.hero h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2.4rem, 5vw, 4.5rem);
    line-height: 1;
    margin: 0.7rem 0 0.75rem;
    color: #f3efe6;
}
.hero h1 span { color: #ff8c32; }
.hero p { color: #aca49a; max-width: 760px; line-height: 1.65; }
.divider {
    height: 1px;
    margin: 1.5rem 0 2rem;
    background: linear-gradient(90deg, transparent, rgba(255,140,50,0.32), transparent);
}
.metric-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.8rem;
    margin: 1rem 0 1.5rem;
}
.metric-box {
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    padding: 0.9rem 1rem;
}
.metric-label {
    font: 500 0.65rem 'DM Mono', monospace;
    letter-spacing: 0.16em;
    color: #7f786f;
    text-transform: uppercase;
}
.metric-value {
    color: #f3efe6;
    font-weight: 700;
    margin-top: 0.3rem;
}
.result-panel {
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.025);
    border-radius: 8px;
    padding: 1.2rem 1.4rem;
    margin: 1rem 0;
}
.panel-label {
    color: #ff8c32;
    font: 500 0.7rem 'DM Mono', monospace;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 0.8rem;
}
.stTabs [data-baseweb="tab-list"] { gap: 0.5rem; }
.stTabs [data-baseweb="tab"] {
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 0.65rem 1rem;
    background: rgba(255,255,255,0.025);
}
.stButton > button, .stDownloadButton > button {
    border-radius: 8px !important;
    border: 0 !important;
    background: linear-gradient(135deg, #ff8c32, #ff5a1a) !important;
    color: #08090d !important;
    font-weight: 800 !important;
}
textarea, input { color: #f3efe6 !important; }
@media (max-width: 760px) {
    .block-container { padding: 1.25rem; }
    .metric-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
""",
    unsafe_allow_html=True,
)


def init_state():
    defaults = {
        "results": {},
        "document_texts": {},
        "indexed_files": [],
        "processed_uploads": set(),
        "last_doc_answer": "",
        "last_comparison": "",
        "running": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def safe_markdown(text: str):
    st.markdown(text or "")


def show_text_result(label: str, text: str):
    safe = html.escape(text or "")
    st.markdown(
        f"""
        <div class="result-panel">
            <div class="panel-label">{label}</div>
            <pre style="white-space:pre-wrap;font-family:'DM Sans',sans-serif;line-height:1.65;color:#d5d0c8;">{safe}</pre>
        </div>
        """,
        unsafe_allow_html=True,
    )


def is_quota_error(exc: Exception) -> bool:
    message = str(exc)
    return any(marker.lower() in message.lower() for marker in QUOTA_MARKERS)


def is_transient_error(exc: Exception) -> bool:
    message = str(exc)
    return any(marker.lower() in message.lower() for marker in TRANSIENT_MARKERS)


def retry_delay_from_error(exc: Exception) -> str:
    message = str(exc)
    retry_delay = re.search(r"'retryDelay': '(\d+)s'", message)
    if retry_delay:
        return f"{retry_delay.group(1)} seconds"

    retry_in = re.search(r"retry in ([\d.]+)s", message, re.IGNORECASE)
    if retry_in:
        return f"{round(float(retry_in.group(1)))} seconds"

    return "a short while"


def user_error_message(exc: Exception) -> str:
    message = str(exc)
    if message.startswith("Gemini quota is exhausted"):
        return message

    if "remote service closed the connection" in message.lower():
        return message

    if is_quota_error(exc):
        return (
            "Gemini quota is exhausted for the selected model. "
            f"Wait about {retry_delay_from_error(exc)}, switch GEMINI_MODEL in .env "
            "to another available model, or use a paid/higher-quota API key."
        )

    if is_transient_error(exc):
        return (
            "A remote service closed the connection before responding. "
            "The app retried the call, but the service still did not respond. "
            "Try again in a moment."
        )

    return str(exc)


def invoke_with_retry(label: str, func, *args, attempts: int = 3, **kwargs):
    for attempt in range(attempts):
        try:
            return func(*args, **kwargs)
        except Exception as exc:
            if is_quota_error(exc):
                raise RuntimeError(user_error_message(exc)) from exc

            if is_transient_error(exc) and attempt < attempts - 1:
                time.sleep(2 * (attempt + 1))
                continue

            if is_transient_error(exc):
                raise RuntimeError(f"{label}: {user_error_message(exc)}") from exc

            raise


def split_pdf_text(text: str):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=180,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return [chunk for chunk in splitter.split_text(text) if chunk.strip()]


def index_uploaded_pdfs(uploaded_files):
    if not uploaded_files:
        return []

    vector_store = get_vector_store()
    indexed = []

    for uploaded in uploaded_files:
        file_key = f"{uploaded.name}:{uploaded.size}"
        if file_key in st.session_state.processed_uploads:
            continue

        safe_name = Path(uploaded.name).name
        file_path = UPLOAD_DIR / safe_name
        file_path.write_bytes(uploaded.getbuffer())

        text = extract_pdf_text(file_path)
        if not text.strip():
            st.warning(f"No extractable text found in {safe_name}.")
            continue

        chunks = split_pdf_text(text)
        if not chunks:
            st.warning(f"No usable text chunks created for {safe_name}.")
            continue

        vector_store.add_texts(
            texts=chunks,
            metadatas=[
                {
                    "source": safe_name,
                    "chunk": idx,
                    "indexed_at": str(int(time.time())),
                }
                for idx, _ in enumerate(chunks)
            ],
        )

        st.session_state.document_texts[safe_name] = text
        st.session_state.indexed_files.append(safe_name)
        st.session_state.processed_uploads.add(file_key)
        indexed.append((safe_name, len(chunks)))

    st.session_state.indexed_files = sorted(set(st.session_state.indexed_files))
    return indexed


def ask_documents(question: str) -> str:
    document_agent = build_document_agent()
    result = invoke_with_retry(
        "Document Agent",
        document_agent.invoke,
        {
            "messages": [
                (
                    "user",
                    "Search the uploaded PDFs in AstraDB for evidence related to this question: "
                    f"{question}",
                )
            ]
        },
    )
    context = response_to_text(result["messages"][-1].content)

    answer = invoke_with_retry(
        "Document answer",
        llm.invoke,
        [
            (
                "system",
                "Answer using only the provided uploaded-document context. "
                "Cite source filenames when available. If the context is insufficient, say so.",
            ),
            (
                "human",
                f"Question:\n{question}\n\nUploaded-document context:\n{context}",
            ),
        ]
    )
    return response_to_text(answer.content)


def run_research(topic: str, use_web: bool, use_docs: bool):
    results = {}

    if use_web:
        with st.spinner("Search Agent is gathering web results..."):
            search_agent = build_search_agent()
            sr = invoke_with_retry(
                "Search Agent",
                search_agent.invoke,
                {
                    "messages": [
                        (
                            "user",
                            f"Find recent, reliable and detailed information about: {topic}",
                        )
                    ]
                },
            )
            results["search"] = response_to_text(sr["messages"][-1].content)
            st.session_state.results = dict(results)

        with st.spinner("Reader Agent is reading the strongest web source..."):
            reader_agent = build_reader_agent()
            rr = invoke_with_retry(
                "Reader Agent",
                reader_agent.invoke,
                {
                    "messages": [
                        (
                            "user",
                            f"Based on these search results about '{topic}', pick the most relevant URL "
                            f"and scrape it for deeper content.\n\nSearch Results:\n{results['search'][:1200]}",
                        )
                    ]
                },
            )
            results["reader"] = response_to_text(rr["messages"][-1].content)
            st.session_state.results = dict(results)

    if use_docs:
        with st.spinner("Document Agent is retrieving uploaded PDF memory..."):
            document_agent = build_document_agent()
            dr = invoke_with_retry(
                "Document Agent",
                document_agent.invoke,
                {
                    "messages": [
                        (
                            "user",
                            f"Search uploaded PDFs in AstraDB for the strongest evidence about: {topic}",
                        )
                    ]
                },
            )
            results["documents"] = response_to_text(dr["messages"][-1].content)
            st.session_state.results = dict(results)

    research_parts = []
    if results.get("search"):
        research_parts.append("WEB SEARCH RESULTS:\n" + results["search"])
    if results.get("reader"):
        research_parts.append("DETAILED WEB READING:\n" + results["reader"])
    if results.get("documents"):
        research_parts.append("UPLOADED PDF MEMORY:\n" + results["documents"])

    with st.spinner("Writer Chain is drafting the research report..."):
        results["writer"] = invoke_with_retry(
            "Writer Chain",
            writer_chain.invoke,
            {
                "topic": topic,
                "research": "\n\n".join(research_parts),
            }
        )
        st.session_state.results = dict(results)

    with st.spinner("Critic Chain is reviewing the report..."):
        results["critic"] = invoke_with_retry(
            "Critic Chain",
            critic_chain.invoke,
            {"report": results["writer"]},
        )
        st.session_state.results = dict(results)

    return results


def compare_documents(left_name: str, right_name: str, focus: str):
    left = st.session_state.document_texts.get(left_name, "")[:12000]
    right = st.session_state.document_texts.get(right_name, "")[:12000]

    response = invoke_with_retry(
        "Document comparison",
        llm.invoke,
        [
            (
                "system",
                "Compare two uploaded PDFs. Be specific, structured, and cite each filename. "
                "Cover overlap, differences, contradictions, missing details, and a short conclusion.",
            ),
            (
                "human",
                f"Focus: {focus or 'general comparison'}\n\n"
                f"Document A ({left_name}):\n{left}\n\n"
                f"Document B ({right_name}):\n{right}",
            ),
        ]
    )
    return response_to_text(response.content)


init_state()

st.markdown(
    """
    <div class="hero">
        <div class="hero-kicker">Multi-Agent Research Workspace</div>
        <h1>Research<span>Mind</span></h1>
        <p>Search the web, index uploaded PDFs into AstraDB memory, ask questions across documents, generate research reports, and compare PDFs from one workspace.</p>
    </div>
    <div class="divider"></div>
    """,
    unsafe_allow_html=True,
)

indexed_count = len(st.session_state.indexed_files)
result_count = len(st.session_state.results)
st.markdown(
    f"""
    <div class="metric-strip">
        <div class="metric-box"><div class="metric-label">Provider</div><div class="metric-value">Gemini</div></div>
        <div class="metric-box"><div class="metric-label">Memory</div><div class="metric-value">AstraDB</div></div>
        <div class="metric-box"><div class="metric-label">PDFs Indexed</div><div class="metric-value">{indexed_count}</div></div>
        <div class="metric-box"><div class="metric-label">Last Outputs</div><div class="metric-value">{result_count}</div></div>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.subheader("Workspace")
    if st.session_state.indexed_files:
        st.write("Indexed PDFs")
        for name in st.session_state.indexed_files:
            st.caption(name)
    else:
        st.caption("No PDFs indexed yet.")

    if st.button("Clear visible results", use_container_width=True):
        st.session_state.results = {}
        st.session_state.last_doc_answer = ""
        st.session_state.last_comparison = ""
        st.rerun()


upload_tab, qa_tab, report_tab, compare_tab = st.tabs(
    ["Uploaded PDFs", "Multi-PDF QA", "Research Reports", "Document Comparison"]
)

with upload_tab:
    st.markdown('<div class="panel-label">Upload and Index</div>', unsafe_allow_html=True)
    uploaded_files = st.file_uploader(
        "Upload PDF files",
        type=["pdf"],
        accept_multiple_files=True,
    )

    if st.button("Index PDFs to AstraDB", type="primary", use_container_width=True):
        try:
            indexed = index_uploaded_pdfs(uploaded_files)
            if indexed:
                for file_name, chunk_count in indexed:
                    st.success(f"Indexed {file_name} into AstraDB memory ({chunk_count} chunks).")
            else:
                st.info("No new PDFs were indexed.")
        except Exception as exc:
            st.error(f"PDF indexing failed: {user_error_message(exc)}")

with qa_tab:
    st.markdown('<div class="panel-label">Ask Uploaded Documents</div>', unsafe_allow_html=True)
    question = st.text_area(
        "Question",
        placeholder="Ask across all PDFs stored in AstraDB memory...",
        height=120,
    )
    if st.button("Ask PDFs", type="primary", use_container_width=True):
        if not question.strip():
            st.warning("Enter a question first.")
        else:
            try:
                with st.spinner("Document Agent is answering from PDF memory..."):
                    st.session_state.last_doc_answer = ask_documents(question.strip())
            except Exception as exc:
                st.error(f"Document QA failed: {user_error_message(exc)}")

    if st.session_state.last_doc_answer:
        show_text_result("Document Answer", st.session_state.last_doc_answer)

with report_tab:
    st.markdown('<div class="panel-label">Research Pipeline</div>', unsafe_allow_html=True)
    topic = st.text_input(
        "Research topic",
        placeholder="e.g. AI agents for clinical research workflows",
        key="topic_input",
    )
    col_a, col_b = st.columns(2)
    with col_a:
        use_web = st.checkbox("Use web search", value=True)
    with col_b:
        use_docs = st.checkbox("Use uploaded PDFs", value=bool(st.session_state.indexed_files))

    if st.button("Run Research Pipeline", type="primary", use_container_width=True):
        if not topic.strip():
            st.warning("Please enter a research topic first.")
        elif not use_web and not use_docs:
            st.warning("Choose web search, uploaded PDFs, or both.")
        else:
            try:
                st.session_state.results = run_research(topic.strip(), use_web, use_docs)
            except Exception as exc:
                st.error(f"Research pipeline failed: {user_error_message(exc)}")

    r = st.session_state.results
    if r:
        if "search" in r:
            with st.expander("Search Agent Output", expanded=False):
                st.text(r["search"])
        if "reader" in r:
            with st.expander("Reader Agent Output", expanded=False):
                st.text(r["reader"])
        if "documents" in r:
            with st.expander("Uploaded PDF Memory", expanded=False):
                st.text(r["documents"])
        if "writer" in r:
            st.markdown('<div class="panel-label">Final Research Report</div>', unsafe_allow_html=True)
            safe_markdown(r["writer"])
            st.download_button(
                label="Download Report (.md)",
                data=r["writer"],
                file_name=f"research_report_{int(time.time())}.md",
                mime="text/markdown",
            )
        if "critic" in r:
            show_text_result("Critic Feedback", r["critic"])

with compare_tab:
    st.markdown('<div class="panel-label">Compare Current Uploaded PDFs</div>', unsafe_allow_html=True)
    sources = st.session_state.indexed_files
    if len(sources) < 2:
        st.info("Upload and index at least two PDFs to compare them.")
    else:
        left_col, right_col = st.columns(2)
        with left_col:
            left_name = st.selectbox("Document A", sources, key="compare_left")
        with right_col:
            right_options = [name for name in sources if name != left_name] or sources
            right_name = st.selectbox("Document B", right_options, key="compare_right")

        focus = st.text_input(
            "Comparison focus",
            placeholder="e.g. methodology, findings, risks, assumptions",
        )
        if st.button("Compare Documents", type="primary", use_container_width=True):
            try:
                with st.spinner("Comparing uploaded PDFs..."):
                    st.session_state.last_comparison = compare_documents(left_name, right_name, focus)
            except Exception as exc:
                st.error(f"Document comparison failed: {user_error_message(exc)}")

    if st.session_state.last_comparison:
        show_text_result("Comparison", st.session_state.last_comparison)


st.markdown(
    """
    <div class="divider"></div>
    <div style="font:500 0.72rem 'DM Mono', monospace;color:#686158;text-align:center;letter-spacing:0.08em;">
        ResearchMind - Gemini, Tavily, Uploaded PDFs, AstraDB Memory, and Streamlit
    </div>
    """,
    unsafe_allow_html=True,
)
