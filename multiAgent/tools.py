# User
#    ↓
# web_search()
#    ↓
# URLs Found
#    ↓
# scrape_url()
#    ↓
# Article Content
#    ↓
# LLM Analysis
#    ↓
# Final Answer


#tools.py
from langchain.tools import tool  #LangChain agents can only use functions as tools if they are decorated with @tool
import requests
from bs4 import BeautifulSoup  #helps to extract the usefull text from the html page
from tavily import TavilyClient #Tavily is a search engine specifically built for AI applications.
import os                       #python's os module Used to access environment variables.
from dotenv import load_dotenv
from rich import print           #Makes terminal output prettier with colors and formatting
load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on a topic . Returns Titles , URLs and snippets."""
    results = tavily.search(query=query,max_results=5)

    out = []  #will hold the formatted search results to be returned as a string to the agent. Each result will include the title, URL, and a snippet of content for context.

    for r in results['results']:
        out.append(
            f"Title: {r['title']}\nURL: {r['url']}\nSnippet: {r['content'][:300]}\n"
        )
    
    return "\n----\n".join(out)


#After finding a webpage, the AI can read its contents.
@tool
def scrape_url(url: str) -> str:
    """Scrape and return clean text content from a given URL for deeper reading."""
    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"}) #Many websites block unknown bots.This makes the request look like a browser.
        soup = BeautifulSoup(resp.text, "html.parser")                             #Converts HTML into a searchable structure.
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()                                     #delete those tags
        return soup.get_text(separator=" ", strip=True)[:3000]  #Converts webpage into plain text.
    except Exception as e:
        return f"Could not scrape URL: {str(e)}"
