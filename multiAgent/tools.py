#tools.py
from langchain.tools import tool #The @tool decorator converts a normal Python function into a LangChain tool.
import requests                  #For making HTTP requests to fetch webpage content.
from bs4 import BeautifulSoup    #For parsing HTML and extracting text from webpages.
from tavily import TavilyClient  #TavilyClient is a Python client for the Tavily API, which provides web search capabilities. Instead of scraping Google directly, you use Tavily:
import os                        #For accessing environment variables, which is a secure way to manage API keys and configuration settings.
from dotenv import load_dotenv   #Loads environment variables from a .env file, allowing you to keep sensitive information like API keys out of your codebase.
load_dotenv()

@tool
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on a topic . Returns Titles , URLs and snippets."""
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        return "TAVILY_API_KEY is missing. Add it to .env to enable web search."

    try:
        tavily = TavilyClient(api_key=tavily_api_key)
        results = tavily.search(query=query, max_results=5)
    except Exception as e:
        return f"Web search failed: {str(e)}"

    out = []

    for r in results.get("results", []):
        out.append(
            f"Title: {r.get('title', 'Untitled')}\n"
            f"URL: {r.get('url', 'No URL')}\n"
            f"Snippet: {r.get('content', '')[:300]}\n"   #Only keeps the first 300 characters.Without this, results could become extremely large.
        )

    if not out:
        return "No web search results were returned."

    return "\n----\n".join(out)


#to extract article text. This allows the agent to read the full content of a webpage for deeper analysis, beyond just the search snippet. 
#This tool reads the actual webpage content.The search tool only gives summaries.The scrape tool gets the full article text.
@tool
def scrape_url(url: str) -> str:
    """Scrape and return clean text content from a given URL for deeper reading."""
    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})  #Makes the request look like a browser.Some sites block requests that don't have a User-Agent.
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")                              #Converts HTML into a searchable structure
        for tag in soup(["script", "style", "nav", "footer"]):                      #Removes:because they usually contain:JavaScript,CSS,menus,footer links,and not useful article content.
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)[:3000]                      #Extract Clean Text,Limit to 3000 chars to avoid overwhelming the agent with too much information.
    except Exception as e:
        return f"Could not scrape URL: {str(e)}"
    


#timeout=8
#Stops waiting after 8 seconds.
#Prevents hanging forever.

#This separation of responsibilities (search → read → write → critique) is a standard agentic workflow and is much more reliable than asking a single LLM prompt to do everything at once.

