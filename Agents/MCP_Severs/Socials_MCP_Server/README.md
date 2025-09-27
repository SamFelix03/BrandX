# Social MCP Server

## Overview

The **Social MCP Server** scrapes and analyzes Social Media comments. Built with **Model Context Protocol (MCP)** and **FastAPI**, it provides both programmatic and HTTP access to authentic social media community insights and engagement data.

### Key Features
- **Multi-Mode Operation**: Supports MCP (stdio), HTTP API, or both simultaneously
- **Social Media-Focused**: Exclusively scrapes Instagram official brand accounts
- **Comment Analysis**: Extracts both positive and negative comments from posts
- **Apify Integration**: Uses professional web scraping infrastructure
- **Cross-Platform**: Works with various Instagram brand accounts
- **Dual Interface**: MCP tools for AI integration + REST API for web services
- **Complete Attribution**: Full usernames, timestamps, and post URLs

---

## Architecture

```
                   Social MCP Server                             
─────────────────────────────────────────────────────────────────
                                                                 
   HTTP Client   ───▶   FastAPI       ───▶   Social       
   Requests            Endpoints              Scraper      
                                 │                        │        
                                 ▼                        ▼        
   MCP Client    ───▶   MCP Server    ───▶    Client       
   Tools               Protocol              Integration   
                                 │                        │        
                                 ▼                        ▼        
   Formatted     ◀───   Comment       ◀──   Social Media  
   Results             Processing            Data         
                                                                 
─────────────────────────────────────────────────────────────────
```

---

## Core Components

### SocialMediaCommentsScraper Class

**Main Engine** for Social Media comment analysis and extraction:

```python
class SocialMediaCommentsScraper:
    def __init__(self):
        self.apify_api_key = APIFY_API_KEY
        self.client = ApifyClient(self.apify_api_key)
```

**Key Methods:**
- `create_social_media_instructions(brand_name)`: Generates Social Media scraping guidelines
- `search_social_media_comments(brand_name)`: Executes Social Media data collection
- `scrape_social_media_comments(brand_name)`: Complete workflow orchestrator

### Multi-Mode Server Configuration

**HTTP Mode** - FastAPI REST API:
```python
app = FastAPI(
    title="Social Media Comments API",
    description="Scrape positive or negative Social Media comments for any brand",
    version="1.0.0"
)
```

**MCP Mode** - Model Context Protocol:
```python
server = Server("social-media-comments-scraper")
```

**Dual Mode** - Both HTTP and MCP simultaneously

---

## Social media-Specific Features

### Official Account Targeting

The server specifically targets brand official Instagram accounts:

### Comment Types Collected

**First Comments:**
- Initial comments on posts (often from the brand itself)
- Pinned or highlighted comments
- Brand announcements and responses

**Latest Comments:**
- Most recent community engagement
- Fresh user feedback and reactions
- Current sentiment and discussions

### Data Extraction Points

**Comment Details:**
- Comment text content
- Username and timestamp
- Comment type classification
- Associated post URL

---

## Data Models

### Request Models

**HTTP Request:**
```python
class SocialMediaCommentsRequest(BaseModel):
    brand_name: str = Field(..., description="Name of the brand to analyze", example="apple")
```

**MCP Tool Schema:**
```python
{
    "name": "scrape_social_media_comments",
    "description": "Scrape Social Media comments from any brand's official account",
    "parameters": {
        "brand_name": {"type": "string"}
    }
}
```

### Response Models

**HTTP Response:**
```python
class SocialMediaCommentsResponse(BaseModel):
    success: bool
    data: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    research_id: Optional[str] = None
    error: Optional[str] = None
```

**Data Structure:**
```python
{
    "comments": [
        {
            "text": "Comment content",
            "username": "instagram_user",
            "timestamp": "2024-03-15T10:30:00Z",
            "type": "latest_comment",
            "post_url": "https://instagram.com/p/...",
            "post_type": "GraphImage"
        }
    ],
    "posts": [...],
    "total_comments": 45,
    "total_posts": 20
}
```

---

## API Endpoints

### HTTP API

#### POST /scrape-social-comments

**Request:**
```json
{
  "brand_name": "apple"
}
```

**Response:**
```json
{
  "success": true,
  "data": "# Instagram Comments from apple\n\n## Summary\n- **Total Posts Analyzed:** 20\n- **Total Comments Found:** 45\n- **Brand:** apple\n\n## Instagram Comments\n### 1. Comment from @user123\n**Posted:** 2024-03-15T10:30:00Z\n**Post URL:** https://instagram.com/p/abc123\n**Type:** latest_comment\n**Comment:** Love the new iPhone camera quality! 📸\n\n### 2. Comment from @techfan\n**Posted:** 2024-03-14T15:45:00Z\n**Post URL:** https://instagram.com/p/def456\n**Type:** first_comment\n**Comment:** Finally got my hands on the new MacBook. Amazing performance!",
  "sources": [
    {
      "text": "Love the new iPhone camera quality! 📸",
      "username": "user123",
      "timestamp": "2024-03-15T10:30:00Z",
      "type": "latest_comment",
      "post_url": "https://instagram.com/p/abc123",
      "post_type": "GraphImage"
    }
  ]
}
```

#### GET /
Root endpoint with API documentation and examples

#### HEAD /health
Health check endpoint for monitoring

### MCP Integration

**Tool Definition:**
```python
Tool(
    name="scrape_social_media_comments",
    description="Scrape Instagram comments from any brand's official account using Apify",
    inputSchema={
        "type": "object",
        "properties": {
            "brand_name": {"type": "string"}
        },
        "required": ["brand_name"]
    }
)
```

---

## Usage Examples

### HTTP API Usage

**cURL Example:**
```bash
curl -X POST http://localhost:8080/scrape-social-comments \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "nike"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/scrape-social-comments",
    json={"brand_name": "tesla"}
)

result = response.json()
print(f"Found {len(result['sources'])} comments")
print(result["data"])
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/scrape-social-comments', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({brand_name: 'starbucks'})
});

const result = await response.json();
console.log(`Analyzed ${result.sources.length} comments`);
```

### MCP Tool Usage

**Direct Tool Call:**
```python
import asyncio
from mcp.client import ClientSession

async def scrape_instagram():
    result = await session.call_tool(
        "scrape_social_media_comments",
        {"brand_name": "spotify"}
    )
    return result
```

---

## Data Processing Pipeline

**Input Configuration:**
```python
run_input = {
    "username": [brand_name.lower()],
    "resultsLimit": 20,
}
```

### Data Processing Pipeline

**Step 1 - Actor Execution:**
```python
run = self.client.actor("nH2AHrwxeTRJoN5hX").call(run_input=run_input)
```

**Step 2 - Dataset Iteration:**
```python
for item in self.client.dataset(run["defaultDatasetId"]).iterate_items():
    # Extract post and comment data
```

**Step 3 - Comment Extraction:**
- First comments from posts
- Latest comments (up to 10 per post)
- Complete metadata preservation

**Step 4 - Data Structuring:**
- Comments array with full attribution
- Posts array with metadata
- Statistics and counts

---

## Server Modes

### HTTP Mode
```bash
SERVER_MODE=http python mcpserver.py
```
- FastAPI REST API server
- CORS enabled for web integration
- OpenAPI documentation at `/docs`

### MCP Mode
```bash
SERVER_MODE=mcp python mcpserver.py
```
- Model Context Protocol server
- stdio communication
- Tool integration for AI systems

### Dual Mode
```bash
SERVER_MODE=both python mcpserver.py
```
- Runs both HTTP and MCP simultaneously
- HTTP server in background task
- MCP server in main thread

---

## Use Cases

### Brand Monitoring
- Track Social Media engagement and sentiment
- Monitor community reactions to posts
- Identify trending topics and discussions

### Social Media Analytics
- Analyze comment patterns and engagement
- Understand audience demographics and behavior
- Track brand mention sentiment over time

### Competitive Analysis
- Compare engagement across competitor accounts
- Analyze community response differences
- Identify successful content strategies

### Content Strategy
- Understand what content generates engagement
- Identify community preferences and interests
- Track campaign performance and feedback

---

## Server Customization

```python
# Port configuration
PORT = int(os.environ.get("PORT", 8080))

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Conclusion

The Social MCP Server provides a robust, professional solution for social media monitoring. Its multi-modal architecture supports both programmatic integration through MCP and web service access through REST API, making it suitable for diverse use cases from AI tool integration to social media analytics platforms.

**Key Strengths:**
- **Multi-Modal**: Supports both MCP and HTTP interfaces
- **Complete Attribution**: Full comment metadata and source information
- **Production-Ready**: Robust error handling and scalable architecture
- **Comprehensive Data**: Both post content and community engagement

Perfect for social media monitoring, brand analytics, competitive research, and understanding authentic community engagement with Social Media brand content.
