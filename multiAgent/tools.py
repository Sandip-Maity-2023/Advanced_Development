from langchain.tools import tool #The @tool decorator converts a normal Python function into a LangChain tool.
import requests                  #For making HTTP requests to fetch webpage content.
from bs4 import BeautifulSoup    #For parsing HTML and extracting text from webpages.
from tavily import TavilyClient  #TavilyClient is a Python client for the Tavily API, which provides web search capabilities. Instead of scraping Google directly, you use Tavily:
import os                        #For accessing environment variables, which is a secure way to manage API keys and configuration settings.
from dotenv import load_dotenv   #Loads environment variables from a .env file, allowing you to keep sensitive information like API keys out of your codebase.
load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on a topic . Returns Titles , URLs and snippets."""
    results = tavily.search(query=query,max_results=5)

    out = []

    for r in results['results']:
        out.append(
            f"Title: {r['title']}\nURL: {r['url']}\nSnippet: {r['content'][:300]}\n"   #Only keeps the first 300 characters.Without this, results could become extremely large.
        )
    
    return "\n----\n".join(out)


#to extract article text. This allows the agent to read the full content of a webpage for deeper analysis, beyond just the search snippet. 
#This tool reads the actual webpage content.The search tool only gives summaries.The scrape tool gets the full article text.
@tool
def scrape_url(url: str) -> str:
    """Scrape and return clean text content from a given URL for deeper reading."""
    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})  #Makes the request look like a browser.Some sites block requests that don't have a User-Agent.
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

