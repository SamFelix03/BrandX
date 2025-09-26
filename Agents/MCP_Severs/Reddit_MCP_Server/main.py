import os
import json
import time
import asyncio
import logging
import threading
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv
from exa_py import Exa
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
import mcp.server.stdio

# FastAPI imports for HTTP API
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Load environment variables
load_dotenv()

# Configuration
EXA_API_KEY = os.environ.get("EXA_API_KEY")
PORT = int(os.environ.get("PORT", 8080))

if not EXA_API_KEY:
    raise ValueError("Please set EXA_API_KEY environment variable")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RedditPostsScraper:
    """Handles Reddit posts scraping using Exa Python SDK"""
    
    def __init__(self):
        self.exa_api_key = EXA_API_KEY
        self.exa = Exa(self.exa_api_key)
        
    def create_reddit_research_instructions(self, product_name: str, sentiment: str) -> str:
        """Create detailed instructions for Exa research based on product and sentiment"""
        
        sentiment_instructions = {
            "positive": f"""
            Find ONLY Reddit posts and discussions about {product_name} that are POSITIVE in nature.
            
            CRITICAL REQUIREMENTS:
            - ONLY search Reddit.com and Reddit subreddits
            - ONLY include posts that specifically mention {product_name}
            - ONLY include posts with positive sentiment about {product_name}
            - IGNORE any general Reddit information, Wikipedia articles, or non-Reddit sources
            - IGNORE any posts that don't specifically discuss {product_name}
            
            REDDIT SOURCES TO FOCUS ON:
            - r/{product_name.lower().replace(' ', '')} (if exists)
            - r/technology, r/gadgets (for tech products)
            - r/cars, r/automotive (for automotive products)
            - r/fitness, r/health (for health/fitness products)
            - r/cooking, r/food (for food/kitchen products)
            - r/gaming, r/pcgaming (for gaming products)
            - r/askreddit discussions mentioning {product_name}
            - r/buyitforlife and r/goodvalue
            - r/productreviews and r/reviews
            
            WHAT TO INCLUDE:
            - Reddit posts praising {product_name}
            - Reddit user testimonials and success stories
            - Reddit recommendations for {product_name}
            - Reddit discussions about positive experiences with {product_name}
            - Reddit posts highlighting {product_name} benefits
            
            WHAT TO EXCLUDE:
            - General Reddit information or Wikipedia articles
            - Posts not specifically about {product_name}
            - Non-Reddit sources or websites
            - Generic Reddit guides or tutorials
            - Posts about other products or brands
            """,
            
            "negative": f"""
            Find ONLY Reddit posts and discussions about {product_name} that are NEGATIVE in nature.
            
            CRITICAL REQUIREMENTS:
            - ONLY search Reddit.com and Reddit subreddits
            - ONLY include posts that specifically mention {product_name}
            - ONLY include posts with negative sentiment about {product_name}
            - IGNORE any general Reddit information, Wikipedia articles, or non-Reddit sources
            - IGNORE any posts that don't specifically discuss {product_name}
            
            REDDIT SOURCES TO FOCUS ON:
            - r/{product_name.lower().replace(' ', '')} (if exists)
            - r/technology, r/gadgets (for tech products)
            - r/cars, r/automotive (for automotive products)
            - r/fitness, r/health (for health/fitness products)
            - r/cooking, r/food (for food/kitchen products)
            - r/gaming, r/pcgaming (for gaming products)
            - r/askreddit discussions mentioning {product_name}
            - r/rant and r/complaints
            - r/wellthatsucks and r/mildlyinfuriating
            
            WHAT TO INCLUDE:
            - Reddit posts criticizing {product_name}
            - Reddit user complaints about {product_name}
            - Reddit discussions about problems with {product_name}
            - Reddit posts about negative experiences with {product_name}
            - Reddit posts highlighting {product_name} issues or defects
            
            WHAT TO EXCLUDE:
            - General Reddit information or Wikipedia articles
            - Posts not specifically about {product_name}
            - Non-Reddit sources or websites
            - Generic Reddit guides or tutorials
            - Posts about other products or brands
            """
        }
        
        base_instruction = sentiment_instructions.get(sentiment.lower(), sentiment_instructions["positive"])
        
        full_instructions = base_instruction + f"""
        
        OUTPUT REQUIREMENTS:
        - Provide ONLY Reddit post quotes that specifically mention {product_name}
        - Include Reddit username, subreddit name, and post URL for each quote
        - Include upvote/downvote counts where available
        - Focus ONLY on authentic Reddit community discussions about {product_name}
        - Present each Reddit post as a separate entry with complete source information
        - Do NOT include summaries, analysis, or general themes
        - Do NOT include non-Reddit sources or general information
        """
        
        return full_instructions
    
    def search_reddit_posts_with_exa(self, product_name: str, sentiment: str) -> Dict[str, Any]:
        """Search for Reddit posts using Exa Python SDK"""
        try:
            logger.info(f"Starting Exa search for {sentiment} Reddit posts about {product_name}")
            
            # Create a more specific query for Reddit posts
            query = f"site:reddit.com {sentiment} {product_name} reddit posts discussions reviews"
            
            logger.info(f"Exa query: {query}")
            
            # Use exa.answer() method for direct results
            result = self.exa.answer(query, text=True)
            
            logger.info("Exa search completed successfully!")
            logger.info(f"Answer: {result.answer}")
            logger.info(f"Citations count: {len(result.citations)}")
            
            # Convert AnswerResult objects to dictionaries
            citations_as_dicts = []
            for citation in result.citations:
                if hasattr(citation, '__dict__'):
                    # Convert AnswerResult object to dictionary
                    citation_dict = {
                        'id': getattr(citation, 'id', ''),
                        'url': getattr(citation, 'url', ''),
                        'title': getattr(citation, 'title', ''),
                        'author': getattr(citation, 'author', ''),
                        'publishedDate': getattr(citation, 'publishedDate', ''),
                        'text': getattr(citation, 'text', '')
                    }
                    citations_as_dicts.append(citation_dict)
                elif isinstance(citation, dict):
                    citations_as_dicts.append(citation)
                else:
                    # Fallback for unexpected types
                    citations_as_dicts.append({'text': str(citation)})
            
            logger.info(f"Converted {len(citations_as_dicts)} citations to dictionaries")
            
            return {
                "success": True,
                "data": result.answer,
                "sources": citations_as_dicts,
                "cost": None  # Cost information not available in exa.answer() response
            }
            
        except Exception as e:
            error_msg = f"Failed to search Reddit posts: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    
    def scrape_reddit_posts(self, product_name: str, sentiment: str) -> Dict[str, Any]:
        """Complete workflow to scrape Reddit posts using Exa Python SDK"""
        # Validate sentiment
        if sentiment.lower() not in ['positive', 'negative']:
            return {
                "success": False,
                "error": "Sentiment must be either 'positive' or 'negative'"
            }
        
        # Search for Reddit posts using Exa Python SDK
        return self.search_reddit_posts_with_exa(product_name, sentiment)

# Initialize the scraper (shared between MCP and HTTP)
scraper = RedditPostsScraper()

# ============================================
# HTTP API SETUP
# ============================================

app = FastAPI(
    title="Reddit Posts API",
    description="Scrape positive or negative Reddit posts for any product using Exa Research",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class RedditPostRequest(BaseModel):
    product_name: str = Field(..., description="Name of the product to analyze", example="iPhone 15")
    sentiment: str = Field(..., description="Type of Reddit posts to scrape", pattern="^(positive|negative)$", example="positive")

class RedditPostResponse(BaseModel):
    success: bool
    data: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    research_id: Optional[str] = None
    error: Optional[str] = None

# HTTP Endpoints
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Reddit Posts API",
        "version": "1.0.0",
        "endpoints": {
            "POST /scrape-reddit-posts": "Scrape Reddit posts with sentiment analysis",
            "GET /health": "Health check endpoint"
        },
        "example_request": {
            "product_name": "iPhone 15",
            "sentiment": "positive"
        }
    }

@app.head("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/scrape-reddit-posts", response_model=RedditPostResponse)
async def scrape_reddit_posts_http(request: RedditPostRequest):
    """
    Scrape Reddit posts with sentiment analysis
    
    - **product_name**: Name of the product to analyze (e.g., "iPhone 15", "Tesla Model 3", "MacBook Pro")
    - **sentiment**: Either "positive" or "negative" Reddit posts to focus on
    """
    try:
        logger.info(f"HTTP request: Scraping {request.sentiment} Reddit posts for {request.product_name}")
        
        # Call the scraper
        result = scraper.scrape_reddit_posts(request.product_name, request.sentiment)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
        
        # Format the response similar to MCP server
        data = result.get("data", {})
        sources = result.get("sources", [])
        
        # Create comprehensive response text
        response_text = f"# {request.sentiment.title()} Reddit Posts about {request.product_name}\n\n"
        
        # Add main research content
        if isinstance(data, str):
            response_text += f"## Analysis\n{data}\n\n"
        elif isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str):
                    response_text += f"## {key.title()}\n{value}\n\n"
                elif isinstance(value, (list, dict)):
                    response_text += f"## {key.title()}\n{json.dumps(value, indent=2)}\n\n"
        
        # Add sources section (citations from exa.answer())
        if sources:
            response_text += "## Reddit Sources\n"
            for i, citation in enumerate(sources[:10], 1):  # Limit to first 10 citations
                if isinstance(citation, dict):
                    title = citation.get("title", f"Reddit Post {i}")
                    url = citation.get("url", "")
                    author = citation.get("author", "")
                    published_date = citation.get("publishedDate", "")
                    text = citation.get("text", "")
                    
                    response_text += f"### {i}. {title}\n"
                    if author:
                        response_text += f"**Reddit User:** {author}\n"
                    if published_date:
                        response_text += f"**Posted:** {published_date}\n"
                    if url:
                        response_text += f"**Reddit URL:** {url}\n"
                    if text and len(text) > 50:
                        response_text += f"**Post Preview:** {text[:200]}...\n"
                    response_text += "\n"
                else:
                    response_text += f"{i}. {citation}\n"
        
        # Add metadata
        response_text += f"\n## Research Metadata\n"
        response_text += f"- **Product:** {request.product_name}\n"
        response_text += f"- **Sentiment:** {request.sentiment.title()}\n"
        response_text += f"- **Reddit Posts Found:** {len(sources)}\n"
        cost_info = result.get("cost")
        if cost_info and isinstance(cost_info, dict) and cost_info.get('total'):
            response_text += f"- **Search Cost:** ${cost_info.get('total', 0):.4f}\n"
        
        return RedditPostResponse(
            success=True,
            data=response_text,
            sources=sources,
            research_id=None  # Not applicable for exa.answer() method
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HTTP API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ============================================
# MCP SERVER SETUP (Original)
# ============================================

# Initialize the MCP server
server = Server("reddit-posts-scraper")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="scrape_reddit_posts",
            description="Scrape positive or negative Reddit posts for any product using Exa Research. Provides comprehensive analysis of Reddit community feedback, discussions, and sentiment.",
            inputSchema={
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "The name of the product to scrape Reddit posts for (e.g., 'iPhone 15', 'Tesla Model 3', 'MacBook Pro')"
                    },
                    "sentiment": {
                        "type": "string",
                        "enum": ["positive", "negative"],
                        "description": "Type of Reddit posts to scrape - 'positive' for favorable posts or 'negative' for critical posts"
                    }
                },
                "required": ["product_name", "sentiment"],
                "additionalProperties": False
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
    """Handle tool calls"""
    if name != "scrape_reddit_posts":
        raise ValueError(f"Unknown tool: {name}")
    
    # Extract arguments
    product_name = arguments.get("product_name")
    sentiment = arguments.get("sentiment")
    
    if not product_name:
        return [TextContent(
            type="text",
            text="Error: product_name is required"
        )]
    
    if not sentiment or sentiment.lower() not in ['positive', 'negative']:
        return [TextContent(
            type="text",
            text="Error: sentiment must be either 'positive' or 'negative'"
        )]
    
    logger.info(f"MCP request: Scraping {sentiment} Reddit posts for product: {product_name}")
    
    try:
        # Scrape Reddit posts
        result = scraper.scrape_reddit_posts(product_name, sentiment)
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error occurred")
            return [TextContent(
                type="text",
                text=f"Error scraping Reddit posts: {error_msg}"
            )]
        
        # Format the response
        data = result.get("data", {})
        sources = result.get("sources", [])
        
        # Create comprehensive response
        response_text = f"# {sentiment.title()} Reddit Posts about {product_name}\n\n"
        
        # Add main research content
        if isinstance(data, str):
            response_text += f"## Analysis\n{data}\n\n"
        elif isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str):
                    response_text += f"## {key.title()}\n{value}\n\n"
                elif isinstance(value, (list, dict)):
                    response_text += f"## {key.title()}\n{json.dumps(value, indent=2)}\n\n"
        
        # Add sources section (citations from exa.answer())
        if sources:
            response_text += "## Reddit Sources\n"
            for i, citation in enumerate(sources[:10], 1):  # Limit to first 10 citations
                if isinstance(citation, dict):
                    title = citation.get("title", f"Reddit Post {i}")
                    url = citation.get("url", "")
                    author = citation.get("author", "")
                    published_date = citation.get("publishedDate", "")
                    text = citation.get("text", "")
                    
                    response_text += f"### {i}. {title}\n"
                    if author:
                        response_text += f"**Reddit User:** {author}\n"
                    if published_date:
                        response_text += f"**Posted:** {published_date}\n"
                    if url:
                        response_text += f"**Reddit URL:** {url}\n"
                    if text and len(text) > 50:
                        response_text += f"**Post Preview:** {text[:200]}...\n"
                    response_text += "\n"
                else:
                    response_text += f"{i}. {citation}\n"
        
        # Add metadata
        response_text += f"\n## Research Metadata\n"
        response_text += f"- **Product:** {product_name}\n"
        response_text += f"- **Sentiment:** {sentiment.title()}\n"
        response_text += f"- **Reddit Posts Found:** {len(sources)}\n"
        cost_info = result.get("cost")
        if cost_info and isinstance(cost_info, dict) and cost_info.get('total'):
            response_text += f"- **Search Cost:** ${cost_info.get('total', 0):.4f}\n"
        
        return [TextContent(
            type="text",
            text=response_text
        )]
        
    except Exception as e:
        error_msg = f"Unexpected error while scraping Reddit posts: {str(e)}"
        logger.error(error_msg)
        return [TextContent(
            type="text",
            text=error_msg
        )]

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available resources"""
    return []

@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """Read a resource"""
    raise ValueError(f"Unknown resource: {uri}")

async def run_mcp_server():
    """Run the MCP server"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="reddit-posts-scraper",
                server_version="1.0.0",
                capabilities={}
            )
        )

async def start_http_server():
    """Start the HTTP server"""
    import uvicorn
    config = uvicorn.Config(app, host="0.0.0.0", port=PORT)
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    """Main function - choose between MCP or HTTP mode"""
    mode = os.environ.get("SERVER_MODE", "http").lower()
    
    if mode == "mcp":
        print("Starting Reddit Posts MCP Server...")
        print("Mode: MCP (stdio)")
        await run_mcp_server()
    elif mode == "http":
        print("Starting Reddit Posts HTTP Server...")
        print(f"Mode: HTTP API on port {PORT}")
        print(f"Access the API at: http://localhost:{PORT}")
        print(f"API Documentation: http://localhost:{PORT}/docs")
        await start_http_server()
    elif mode == "both":
        print("Starting Reddit Posts Server in BOTH modes...")
        print(f"HTTP API on port {PORT}")
        print("MCP Server via stdio")
        
        # Start HTTP server in background task
        import asyncio
        http_task = asyncio.create_task(start_http_server())
        
        # Run MCP server in main thread
        await run_mcp_server()
    else:
        print(f"Unknown SERVER_MODE: {mode}. Use 'http', 'mcp', or 'both'")

if __name__ == "__main__":
    print("Reddit Posts Server - Multi-Mode")
    print("="*50)
    print("Environment Variables:")
    print(f"- SERVER_MODE: {os.environ.get('SERVER_MODE', 'http')} (http/mcp/both)")
    print(f"- PORT: {PORT}")
    print(f"- EXA_API_KEY: {'✓ Set' if EXA_API_KEY else '✗ Missing'}")
    print("="*50)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down Reddit Posts Server...")
        print("Server stopped.")