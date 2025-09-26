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

class BrandReviewsScraper:
    """Handles brand reviews scraping using Exa Python SDK"""
    
    def __init__(self):
        self.exa_api_key = EXA_API_KEY
        self.exa = Exa(self.exa_api_key)
        
    def create_review_research_instructions(self, brand_name: str, sentiment: str) -> str:
        """Create detailed instructions for Exa research based on brand and sentiment"""
        
        sentiment_instructions = {
            "positive": """
            Focus specifically on POSITIVE reviews, testimonials, and customer feedback about {brand_name}.
            
            Please gather and analyze:
            
            1. POSITIVE CUSTOMER REVIEWS:
            - High-rated reviews from Google Reviews, Yelp, Trustpilot, Amazon, etc.
            - Customer testimonials and success stories
            - Product review sites with 4-5 star ratings
            - User-generated content praising the brand
            
            2. POSITIVE ASPECTS TO HIGHLIGHT:
            - What customers love most about the brand/products
            - Standout features and benefits mentioned repeatedly
            - Excellent customer service experiences
            - Product quality and reliability praise
            - Value for money positive mentions
            
            3. POSITIVE SENTIMENT ANALYSIS:
            - Common positive themes and keywords
            - Most praised product features or services
            - Customer loyalty and repeat purchase indicators
            - Positive brand reputation elements
            - Awards and recognitions from customers/industry
            
            4. SUCCESS STORIES:
            - Customer transformation stories
            - Problem-solving success cases
            - Long-term customer satisfaction examples
            - Brand advocacy and referral stories
            NEVER EVER use reddit
            IMPORTANT: Only include genuinely positive reviews and feedback. 
            Provide specific quotes, ratings, and sources for all positive reviews found.
            Focus on authentic customer voices and experiences.
            """,
            
            "negative": """
            Focus specifically on NEGATIVE reviews, complaints, and critical feedback about {brand_name}.
            
            Please gather and analyze:
            
            1. NEGATIVE CUSTOMER REVIEWS:
            - Low-rated reviews from Google Reviews, Yelp, Trustpilot, Amazon, etc.
            - Customer complaints and negative experiences
            - Product review sites with 1-2 star ratings
            - Complaint forums and consumer advocacy sites
            
            2. COMMON COMPLAINTS AND ISSUES:
            - Most frequently mentioned problems
            - Product quality and reliability issues
            - Customer service complaints
            - Pricing and value concerns
            - Delivery, shipping, or service problems
            
            3. NEGATIVE SENTIMENT ANALYSIS:
            - Recurring negative themes and keywords
            - Most criticized aspects of products/services
            - Customer frustration points
            - Brand reputation challenges
            - Competitive disadvantages mentioned
            
            4. CRITICAL FEEDBACK AREAS:
            - Product defects or failures reported
            - Service quality issues
            - Communication and support problems
            - Misleading marketing or expectations vs reality
            - Refund, return, or warranty issues
            NEVER EVER use reddit
            IMPORTANT: Only include genuinely negative reviews and constructive criticism.
            Provide specific quotes, ratings, and sources for all negative reviews found.
            Focus on authentic customer complaints and concerns.
            Be objective and factual in presenting negative feedback.
            """
        }
        
        base_instruction = sentiment_instructions.get(sentiment.lower(), sentiment_instructions["positive"])
        
        full_instructions = base_instruction.format(brand_name=brand_name) + f"""
        
        RESEARCH SOURCES TO EXPLORE:
        - Google Reviews and Google My Business
        - Yelp and local review platforms
        - Trustpilot and similar review aggregators
        - Amazon product reviews (if applicable)
        - Industry-specific review sites
        - Consumer complaint websites (Better Business Bureau, ConsumerAffairs)
        - App store reviews (if mobile app exists)
        - Forums and community discussions
        - YouTube comments and video reviews
        - News articles mentioning customer experiences
        
        ANALYSIS REQUIREMENTS:
        - Provide specific review quotes with sources
        - Include review ratings/scores where available
        - Identify patterns in {sentiment.lower()} feedback
        - Categorize reviews by type (product, service, support, etc.)
        - Note the recency of reviews (prioritize recent feedback)
        - Mention review volume and overall sentiment distribution
        - Include geographic patterns if relevant
        NEVER EVER use reddit
        OUTPUT FORMAT:
        Structure your findings with clear categories, specific examples, and proper source citations.
        Include both summary insights and detailed review excerpts.
        """
        
        return full_instructions
    
    def search_reviews_with_exa(self, brand_name: str, sentiment: str) -> Dict[str, Any]:
        """Search for brand reviews using Exa Python SDK"""
        try:
            logger.info(f"Starting Exa search for {sentiment} reviews of {brand_name}")
            
            # Create a focused query for the specific sentiment
            query = f"Find {sentiment} customer reviews and testimonials for {brand_name} from across the internet."
            
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
            error_msg = f"Failed to search reviews: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    
    def scrape_reviews(self, brand_name: str, sentiment: str) -> Dict[str, Any]:
        """Complete workflow to scrape brand reviews using Exa Python SDK"""
        # Validate sentiment
        if sentiment.lower() not in ['positive', 'negative']:
            return {
                "success": False,
                "error": "Sentiment must be either 'positive' or 'negative'"
            }
        
        # Search for reviews using Exa Python SDK
        return self.search_reviews_with_exa(brand_name, sentiment)

# Initialize the scraper (shared between MCP and HTTP)
scraper = BrandReviewsScraper()

# ============================================
# HTTP API SETUP
# ============================================

app = FastAPI(
    title="Brand Reviews API",
    description="Scrape positive or negative reviews for any brand using Exa Research",
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
class ReviewRequest(BaseModel):
    brand_name: str = Field(..., description="Name of the brand to analyze", example="Tesla")
    sentiment: str = Field(..., description="Type of reviews to scrape", pattern="^(positive|negative)$", example="positive")

class ReviewResponse(BaseModel):
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
        "message": "Brand Reviews API",
        "version": "1.0.0",
        "endpoints": {
            "POST /scrape-reviews": "Scrape brand reviews with sentiment analysis",
            "GET /health": "Health check endpoint"
        },
        "example_request": {
            "brand_name": "Tesla",
            "sentiment": "positive"
        }
    }

@app.head("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/scrape-reviews", response_model=ReviewResponse)
async def scrape_reviews_http(request: ReviewRequest):
    """
    Scrape brand reviews with sentiment analysis
    
    - **brand_name**: Name of the brand to analyze (e.g., "Tesla", "Apple", "McDonald's")
    - **sentiment**: Either "positive" or "negative" reviews to focus on
    """
    try:
        logger.info(f"HTTP request: Scraping {request.sentiment} reviews for {request.brand_name}")
        
        # Call the scraper
        result = scraper.scrape_reviews(request.brand_name, request.sentiment)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
        
        # Format the response similar to MCP server
        data = result.get("data", {})
        sources = result.get("sources", [])
        
        # Create comprehensive response text
        response_text = f"# {request.sentiment.title()} Reviews for {request.brand_name}\n\n"
        
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
            response_text += "## Sources\n"
            for i, citation in enumerate(sources[:10], 1):  # Limit to first 10 citations
                if isinstance(citation, dict):
                    title = citation.get("title", f"Source {i}")
                    url = citation.get("url", "")
                    author = citation.get("author", "")
                    published_date = citation.get("publishedDate", "")
                    text = citation.get("text", "")
                    
                    response_text += f"### {i}. {title}\n"
                    if author:
                        response_text += f"**Author:** {author}\n"
                    if published_date:
                        response_text += f"**Published:** {published_date}\n"
                    if url:
                        response_text += f"**URL:** {url}\n"
                    if text and len(text) > 50:
                        response_text += f"**Preview:** {text[:200]}...\n"
                    response_text += "\n"
                else:
                    response_text += f"{i}. {citation}\n"
        
        # Add metadata
        response_text += f"\n## Research Metadata\n"
        response_text += f"- **Brand:** {request.brand_name}\n"
        response_text += f"- **Sentiment:** {request.sentiment.title()}\n"
        response_text += f"- **Citations Found:** {len(sources)}\n"
        cost_info = result.get("cost")
        if cost_info and isinstance(cost_info, dict) and cost_info.get('total'):
            response_text += f"- **Search Cost:** ${cost_info.get('total', 0):.4f}\n"
        
        return ReviewResponse(
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
server = Server("brand-reviews-scraper")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="scrape_brand_reviews",
            description="Scrape positive or negative reviews for any brand using Exa Research. Provides comprehensive analysis of customer feedback, ratings, and sentiment.",
            inputSchema={
                "type": "object",
                "properties": {
                    "brand_name": {
                        "type": "string",
                        "description": "The name of the brand to scrape reviews for (e.g., 'Tesla', 'Apple iPhone', 'McDonald's')"
                    },
                    "sentiment": {
                        "type": "string",
                        "enum": ["positive", "negative"],
                        "description": "Type of reviews to scrape - 'positive' for good reviews or 'negative' for critical reviews"
                    }
                },
                "required": ["brand_name", "sentiment"],
                "additionalProperties": False
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
    """Handle tool calls"""
    if name != "scrape_brand_reviews":
        raise ValueError(f"Unknown tool: {name}")
    
    # Extract arguments
    brand_name = arguments.get("brand_name")
    sentiment = arguments.get("sentiment")
    
    if not brand_name:
        return [TextContent(
            type="text",
            text="Error: brand_name is required"
        )]
    
    if not sentiment or sentiment.lower() not in ['positive', 'negative']:
        return [TextContent(
            type="text",
            text="Error: sentiment must be either 'positive' or 'negative'"
        )]
    
    logger.info(f"MCP request: Scraping {sentiment} reviews for brand: {brand_name}")
    
    try:
        # Scrape reviews
        result = scraper.scrape_reviews(brand_name, sentiment)
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error occurred")
            return [TextContent(
                type="text",
                text=f"Error scraping reviews: {error_msg}"
            )]
        
        # Format the response
        data = result.get("data", {})
        sources = result.get("sources", [])
        
        # Create comprehensive response
        response_text = f"# {sentiment.title()} Reviews for {brand_name}\n\n"
        
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
            response_text += "## Sources\n"
            for i, citation in enumerate(sources[:10], 1):  # Limit to first 10 citations
                if isinstance(citation, dict):
                    title = citation.get("title", f"Source {i}")
                    url = citation.get("url", "")
                    author = citation.get("author", "")
                    published_date = citation.get("publishedDate", "")
                    text = citation.get("text", "")
                    
                    response_text += f"### {i}. {title}\n"
                    if author:
                        response_text += f"**Author:** {author}\n"
                    if published_date:
                        response_text += f"**Published:** {published_date}\n"
                    if url:
                        response_text += f"**URL:** {url}\n"
                    if text and len(text) > 50:
                        response_text += f"**Preview:** {text[:200]}...\n"
                    response_text += "\n"
                else:
                    response_text += f"{i}. {citation}\n"
        
        # Add metadata
        response_text += f"\n## Research Metadata\n"
        response_text += f"- **Brand:** {brand_name}\n"
        response_text += f"- **Sentiment:** {sentiment.title()}\n"
        response_text += f"- **Citations Found:** {len(sources)}\n"
        cost_info = result.get("cost")
        if cost_info and isinstance(cost_info, dict) and cost_info.get('total'):
            response_text += f"- **Search Cost:** ${cost_info.get('total', 0):.4f}\n"
        
        return [TextContent(
            type="text",
            text=response_text
        )]
        
    except Exception as e:
        error_msg = f"Unexpected error while scraping reviews: {str(e)}"
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
                server_name="brand-reviews-scraper",
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
        print("Starting Brand Reviews MCP Server...")
        print("Mode: MCP (stdio)")
        await run_mcp_server()
    elif mode == "http":
        print("Starting Brand Reviews HTTP Server...")
        print(f"Mode: HTTP API on port {PORT}")
        print(f"Access the API at: http://localhost:{PORT}")
        print(f"API Documentation: http://localhost:{PORT}/docs")
        await start_http_server()
    elif mode == "both":
        print("Starting Brand Reviews Server in BOTH modes...")
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
    print("Brand Reviews Server - Multi-Mode")
    print("="*50)
    print("Environment Variables:")
    print(f"- SERVER_MODE: {os.environ.get('SERVER_MODE', 'http')} (http/mcp/both)")
    print(f"- PORT: {PORT}")
    print(f"- EXA_API_KEY: {'✓ Set' if EXA_API_KEY else '✗ Missing'}")
    print("="*50)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down Brand Reviews Server...")
        print("Server stopped.")