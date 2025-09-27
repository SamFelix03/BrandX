import os
import json
import time
import asyncio
import logging
import threading
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv
from apify_client import ApifyClient
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
APIFY_API_KEY = os.environ.get("APIFY_API_KEY")
PORT = int(os.environ.get("PORT", 8080))

if not APIFY_API_KEY:
    raise ValueError("Please set APIFY_API_KEY environment variable")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SocialMediaCommentsScraper:
    """Handles social media comments scraping using Apify Client"""
    
    def __init__(self):
        self.apify_api_key = APIFY_API_KEY
        self.client = ApifyClient(self.apify_api_key)
        
    def create_social_media_instructions(self, brand_name: str) -> str:
        """Create detailed instructions for social media comments research"""
        
        instructions = f"""
        Find Instagram posts and comments from {brand_name}'s official account.
        
        CRITICAL REQUIREMENTS:
        - ONLY search Instagram posts from {brand_name}'s official account
        - Include ALL comments from the posts (both positive and negative)
        - IGNORE any general Instagram information or non-{brand_name} content
        
        WHAT TO INCLUDE:
        - ALL Instagram comments from {brand_name}'s posts
        - Instagram user testimonials and experiences
        - Instagram recommendations and discussions
        - Instagram comments about experiences with {brand_name}
        - Instagram comments highlighting {brand_name} features
        
        WHAT TO EXCLUDE:
        - General Instagram information or guides
        - Comments not from {brand_name}'s official account
        - Non-Instagram sources or websites
        - Generic social media guides or tutorials
        - Comments about other products or brands
        """
        
        full_instructions = instructions + f"""
        
        OUTPUT REQUIREMENTS:
        - Provide ALL Instagram comment quotes from {brand_name}'s posts
        - Include Instagram username, timestamp, and post URL for each comment
        - Focus ONLY on authentic Instagram community discussions from {brand_name}'s account
        - Present each Instagram comment as a separate entry with complete source information
        - Do NOT include summaries, analysis, or general themes
        - Do NOT include non-Instagram sources or general information
        """
        
        return full_instructions
    
    def search_social_media_comments(self, brand_name: str) -> Dict[str, Any]:
        """Search for social media comments using Apify Client"""
        try:
            logger.info(f"Starting Apify search for Instagram comments from {brand_name}")
            
            # Prepare the Actor input
            run_input = {
                "username": [brand_name.lower()],
                "resultsLimit": 20,  # Increased to 20 posts for more data
            }
            
            logger.info(f"Apify run input: {json.dumps(run_input, indent=2)}")
            
            # Run the Actor and wait for it to finish
            run = self.client.actor("nH2AHrwxeTRJoN5hX").call(run_input=run_input)
            
            logger.info("Apify search completed successfully!")
            logger.info(f"Run ID: {run.get('id', 'Unknown')}")
            logger.info(f"Dataset ID: {run.get('defaultDatasetId', 'Unknown')}")
            
            # Fetch and extract comments from the run's dataset
            comments_data = []
            posts_data = []
            
            for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
                try:
                    # Extract post info
                    post_url = item.get("url", "Unknown URL")
                    post_type = item.get("type", "Unknown")
                    post_caption = item.get("caption", "")
                    post_timestamp = item.get("timestamp", "")
                    
                    post_data = {
                        "url": post_url,
                        "type": post_type,
                        "caption": post_caption,
                        "timestamp": post_timestamp
                    }
                    posts_data.append(post_data)
                    
                    # Extract first comment if exists
                    first_comment = item.get("firstComment", "")
                    if first_comment:
                        comment_data = {
                            "text": first_comment,
                            "type": "first_comment",
                            "post_url": post_url,
                            "post_type": post_type,
                            "username": "Unknown",
                            "timestamp": "Unknown"
                        }
                        comments_data.append(comment_data)
                    
                    # Extract latest comments (limit to first 5 comments per post)
                    latest_comments = item.get("latestComments", [])
                    if latest_comments:
                        for comment in latest_comments[:5]:  # Increased to first 5 comments per post
                            comment_text = comment.get("text", "")
                            username = comment.get("ownerUsername", "Unknown")
                            timestamp = comment.get("timestamp", "Unknown")
                            
                            comment_data = {
                                "text": comment_text,
                                "username": username,
                                "timestamp": timestamp,
                                "type": "latest_comment",
                                "post_url": post_url,
                                "post_type": post_type
                            }
                            comments_data.append(comment_data)
                    
                except Exception as e:
                    logger.error(f"Error processing item: {e}")
                    continue
            
            logger.info(f"Extracted {len(comments_data)} comments from {len(posts_data)} posts")
            
            return {
                "success": True,
                "data": {
                    "comments": comments_data,
                    "posts": posts_data,
                    "total_comments": len(comments_data),
                    "total_posts": len(posts_data)
                },
                "brand_name": brand_name
            }
            
        except Exception as e:
            error_msg = f"Failed to search social media comments: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    def scrape_social_media_comments(self, brand_name: str) -> Dict[str, Any]:
        """Complete workflow to scrape social media comments using Apify Client"""
        # Search for social media comments using Apify Client
        return self.search_social_media_comments(brand_name)

# Initialize the scraper (shared between MCP and HTTP)
scraper = SocialMediaCommentsScraper()

# ============================================
# HTTP API SETUP
# ============================================

app = FastAPI(
    title="Social Media Comments API",
    description="Scrape positive or negative Instagram comments for any brand using Apify",
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
class SocialMediaCommentsRequest(BaseModel):
    brand_name: str = Field(..., description="Name of the brand to analyze", example="apple")

class SocialMediaCommentsResponse(BaseModel):
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
        "message": "Social Media Comments API",
        "version": "1.0.0",
        "endpoints": {
            "POST /scrape-social-comments": "Scrape Instagram comments from brand's official account",
            "GET /health": "Health check endpoint"
        },
        "example_request": {
            "brand_name": "apple"
        }
    }

@app.head("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/scrape-social-comments", response_model=SocialMediaCommentsResponse)
async def scrape_social_comments_http(request: SocialMediaCommentsRequest):
    """
    Scrape Instagram comments from brand's official account
    
    - **brand_name**: Name of the brand to analyze (e.g., "apple", "nike", "tesla")
    """
    try:
        logger.info(f"HTTP request: Scraping Instagram comments for {request.brand_name}")
        
        # Call the scraper
        result = scraper.scrape_social_media_comments(request.brand_name)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
        
        # Format the response similar to MCP server
        data = result.get("data", {})
        
        # Create comprehensive response text
        response_text = f"# Instagram Comments from {request.brand_name}\n\n"
        
        # Add main research content
        if isinstance(data, dict):
            comments = data.get("comments", [])
            posts = data.get("posts", [])
            
            response_text += f"## Summary\n"
            response_text += f"- **Total Posts Analyzed:** {data.get('total_posts', 0)}\n"
            response_text += f"- **Total Comments Found:** {data.get('total_comments', 0)}\n"
            response_text += f"- **Brand:** {request.brand_name}\n\n"
            
            # Add comments section
            if comments:
                response_text += "## Instagram Comments\n"
                for i, comment in enumerate(comments[:15], 1):  # Increased to first 15 comments
                    comment_text = comment.get("text", "")
                    username = comment.get("username", "Unknown")
                    timestamp = comment.get("timestamp", "")
                    post_url = comment.get("post_url", "")
                    comment_type = comment.get("type", "")
                    
                    response_text += f"### {i}. Comment from @{username}\n"
                    if timestamp:
                        response_text += f"**Posted:** {timestamp}\n"
                    if post_url:
                        response_text += f"**Post URL:** {post_url}\n"
                    response_text += f"**Type:** {comment_type}\n"
                    response_text += f"**Comment:** {comment_text}\n\n"
            else:
                response_text += "## Instagram Comments\nNo comments found for this brand.\n\n"
            
            # Add posts section
            if posts:
                response_text += "## Instagram Posts Analyzed\n"
                for i, post in enumerate(posts[:8], 1):  # Increased to first 8 posts
                    post_url = post.get("url", "")
                    post_type = post.get("type", "")
                    post_caption = post.get("caption", "")
                    post_timestamp = post.get("timestamp", "")
                    
                    response_text += f"### {i}. Post\n"
                    response_text += f"**URL:** {post_url}\n"
                    response_text += f"**Type:** {post_type}\n"
                    if post_timestamp:
                        response_text += f"**Posted:** {post_timestamp}\n"
                    if post_caption:
                        response_text += f"**Caption:** {post_caption[:200]}...\n"
                    response_text += "\n"
        
        return SocialMediaCommentsResponse(
            success=True,
            data=response_text,
            sources=data.get("comments", []),
            research_id=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HTTP API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ============================================
# MCP SERVER SETUP
# ============================================

# Initialize the MCP server
server = Server("social-media-comments-scraper")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="scrape_social_media_comments",
            description="Scrape Instagram comments from any brand's official account using Apify. Provides comprehensive analysis of Instagram community feedback and comments.",
            inputSchema={
                "type": "object",
                "properties": {
                    "brand_name": {
                        "type": "string",
                        "description": "The name of the brand to scrape Instagram comments for (e.g., 'apple', 'nike', 'tesla')"
                    }
                },
                "required": ["brand_name"],
                "additionalProperties": False
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
    """Handle tool calls"""
    if name != "scrape_social_media_comments":
        raise ValueError(f"Unknown tool: {name}")
    
    # Extract arguments
    brand_name = arguments.get("brand_name")
    
    if not brand_name:
        return [TextContent(
            type="text",
            text="Error: brand_name is required"
        )]
    
    logger.info(f"MCP request: Scraping Instagram comments for brand: {brand_name}")
    
    try:
        # Scrape social media comments
        result = scraper.scrape_social_media_comments(brand_name)
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error occurred")
            return [TextContent(
                type="text",
                text=f"Error scraping Instagram comments: {error_msg}"
            )]
        
        # Format the response
        data = result.get("data", {})
        
        # Create comprehensive response
        response_text = f"# Instagram Comments from {brand_name}\n\n"
        
        # Add main research content
        if isinstance(data, dict):
            comments = data.get("comments", [])
            posts = data.get("posts", [])
            
            response_text += f"## Summary\n"
            response_text += f"- **Total Posts Analyzed:** {data.get('total_posts', 0)}\n"
            response_text += f"- **Total Comments Found:** {data.get('total_comments', 0)}\n"
            response_text += f"- **Brand:** {brand_name}\n\n"
            
            # Add comments section
            if comments:
                response_text += "## Instagram Comments\n"
                for i, comment in enumerate(comments[:15], 1):  # Increased to first 15 comments
                    comment_text = comment.get("text", "")
                    username = comment.get("username", "Unknown")
                    timestamp = comment.get("timestamp", "")
                    post_url = comment.get("post_url", "")
                    comment_type = comment.get("type", "")
                    
                    response_text += f"### {i}. Comment from @{username}\n"
                    if timestamp:
                        response_text += f"**Posted:** {timestamp}\n"
                    if post_url:
                        response_text += f"**Post URL:** {post_url}\n"
                    response_text += f"**Type:** {comment_type}\n"
                    response_text += f"**Comment:** {comment_text}\n\n"
            else:
                response_text += "## Instagram Comments\nNo comments found for this brand.\n\n"
            
            # Add posts section
            if posts:
                response_text += "## Instagram Posts Analyzed\n"
                for i, post in enumerate(posts[:8], 1):  # Increased to first 8 posts
                    post_url = post.get("url", "")
                    post_type = post.get("type", "")
                    post_caption = post.get("caption", "")
                    post_timestamp = post.get("timestamp", "")
                    
                    response_text += f"### {i}. Post\n"
                    response_text += f"**URL:** {post_url}\n"
                    response_text += f"**Type:** {post_type}\n"
                    if post_timestamp:
                        response_text += f"**Posted:** {post_timestamp}\n"
                    if post_caption:
                        response_text += f"**Caption:** {post_caption[:200]}...\n"
                    response_text += "\n"
        
        return [TextContent(
            type="text",
            text=response_text
        )]
        
    except Exception as e:
        error_msg = f"Unexpected error while scraping Instagram comments: {str(e)}"
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
                server_name="social-media-comments-scraper",
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
        print("Starting Social Media Comments MCP Server...")
        print("Mode: MCP (stdio)")
        await run_mcp_server()
    elif mode == "http":
        print("Starting Social Media Comments HTTP Server...")
        print(f"Mode: HTTP API on port {PORT}")
        print(f"Access the API at: http://localhost:{PORT}")
        print(f"API Documentation: http://localhost:{PORT}/docs")
        await start_http_server()
    elif mode == "both":
        print("Starting Social Media Comments Server in BOTH modes...")
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
    print("Social Media Comments Server - Multi-Mode")
    print("="*50)
    print("Environment Variables:")
    print(f"- SERVER_MODE: {os.environ.get('SERVER_MODE', 'http')} (http/mcp/both)")
    print(f"- PORT: {PORT}")
    print(f"- APIFY_API_KEY: {'✓ Set' if APIFY_API_KEY else '✗ Missing'}")
    print("="*50)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down Social Media Comments Server...")
        print("Server stopped.")