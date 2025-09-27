# Reddit MCP Server

## Overview

The **Reddit MCP Server** is a powerful multi-modal service that scrapes and analyzes Reddit posts with sentiment filtering for any product or topic. Built with **Model Context Protocol (MCP)** and **FastAPI**, it provides both programmatic and HTTP access to Reddit community insights using the Exa Research API.

### Key Features
- **Multi-Mode Operation**: Supports MCP (stdio), HTTP API, or both simultaneously
- **Sentiment Analysis**: Filters Reddit posts by positive or negative sentiment
- **Reddit-Focused**: Exclusively searches Reddit.com and subreddits
- **Community Insights**: Analyzes authentic Reddit user discussions and opinions
- **Cross-Platform**: Works with various Reddit communities and subreddits
- **Dual Interface**: MCP tools for AI integration + REST API for web services
- **Source Attribution**: Complete Reddit post links, usernames, and metadata

---

## Architecture

```
                    Reddit MCP Server                            
─────────────────────────────────────────────────────────────────
                                                                 
   HTTP Client   ───▶   FastAPI       ───▶   Reddit        
   Requests            Endpoints              Scraper       
                                 │                        │        
                                 ▼                        ▼        
   MCP Client    ───▶   MCP Server    ───▶   Exa API       
   Tools               Protocol              Integration   
                                 │                        │        
                                 ▼                        ▼        
   Formatted     ◀───   Response      ◀───   Reddit Posts  
   Results             Processing            Collection    
                                                                 
─────────────────────────────────────────────────────────────────
```

---

## Core Components

### RedditPostsScraper Class

**Main Engine** for Reddit post analysis and extraction:

```python
class RedditPostsScraper:
    def __init__(self):
        self.exa_api_key = EXA_API_KEY
        self.exa = Exa(self.exa_api_key)
```

**Key Methods:**
- `create_reddit_research_instructions(product_name, sentiment)`: Generates targeted Reddit search prompts
- `search_reddit_posts_with_exa(product_name, sentiment)`: Executes Reddit-specific searches
- `scrape_reddit_posts(product_name, sentiment)`: Complete workflow orchestrator

### Multi-Mode Server Configuration

**HTTP Mode** - FastAPI REST API:
```python
app = FastAPI(
    title="Reddit Posts API",
    description="Scrape positive or negative Reddit posts for any product using Exa Research",
    version="1.0.0"
)
```

**MCP Mode** - Model Context Protocol:
```python
server = Server("reddit-posts-scraper")
```

**Dual Mode** - Both HTTP and MCP simultaneously

---

## Reddit-Specific Features

### Targeted Subreddit Analysis

The server intelligently targets relevant subreddits based on product category:

**Technology Products:**
- `r/technology`, `r/gadgets`, `r/pcgaming`

**Automotive Products:**
- `r/cars`, `r/automotive`, `r/teslamotors`

**Health & Fitness:**
- `r/fitness`, `r/health`, `r/nutrition`

**Food & Kitchen:**
- `r/cooking`, `r/food`, `r/kitchenware`

**Gaming Products:**
- `r/gaming`, `r/pcgaming`, `r/buildapc`

**General Communities:**
- `r/askreddit`, `r/buyitforlife`, `r/productreviews`

### Sentiment-Specific Targeting

**Positive Sentiment Sources:**
- `r/buyitforlife` - Long-lasting product recommendations
- `r/goodvalue` - Value-for-money discussions
- `r/productreviews` - Positive product experiences

**Negative Sentiment Sources:**
- `r/rant` - User complaints and frustrations
- `r/complaints` - Product and service issues
- `r/wellthatsucks` - Disappointing experiences
- `r/mildlyinfuriating` - Minor but notable problems

---

## Data Models

### Request Models

**HTTP Request:**
```python
class RedditPostRequest(BaseModel):
    product_name: str = Field(..., description="Name of the product to analyze", example="iPhone 15")
    sentiment: str = Field(..., description="Type of Reddit posts to scrape", pattern="^(positive|negative)$", example="positive")
```

**MCP Tool Schema:**
```python
{
    "name": "scrape_reddit_posts",
    "description": "Scrape positive or negative Reddit posts for any product using Exa Research",
    "parameters": {
        "product_name": {"type": "string"},
        "sentiment": {"type": "string", "enum": ["positive", "negative"]}
    }
}
```

### Response Models

**HTTP Response:**
```python
class RedditPostResponse(BaseModel):
    success: bool
    data: Optional[str] = None
    sources: Optional[List[Dict[str, Any]]] = None
    research_id: Optional[str] = None
    error: Optional[str] = None
```

---

## API Endpoints

### HTTP API

#### POST /scrape-reddit-posts

**Request:**
```json
{
  "product_name": "iPhone 15",
  "sentiment": "positive"
}
```

**Response:**
```json
{
  "success": true,
  "data": "# Positive Reddit Posts about iPhone 15\n\n## Analysis\nReddit users consistently praise the iPhone 15's camera quality...",
  "sources": [
    {
      "title": "iPhone 15 Pro Max Review - r/apple",
      "url": "https://reddit.com/r/apple/comments/...",
      "author": "u/techreviewer",
      "publishedDate": "2024-03-15",
      "text": "Just got my iPhone 15 and the camera is incredible..."
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
    name="scrape_reddit_posts",
    description="Scrape positive or negative Reddit posts for any product",
    inputSchema={
        "type": "object",
        "properties": {
            "product_name": {"type": "string"},
            "sentiment": {"type": "string", "enum": ["positive", "negative"]}
        },
        "required": ["product_name", "sentiment"]
    }
)
```

---

## Usage Examples

### HTTP API Usage

**cURL Example:**
```bash
curl -X POST http://localhost:8080/scrape-reddit-posts \
  -H "Content-Type: application/json" \
  -d '{"product_name": "Tesla Model 3", "sentiment": "positive"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/scrape-reddit-posts",
    json={
        "product_name": "MacBook Pro M3",
        "sentiment": "negative"
    }
)

result = response.json()
print(result["data"])
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/scrape-reddit-posts', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        product_name: 'Nintendo Switch',
        sentiment: 'positive'
    })
});

const result = await response.json();
console.log(result.data);
```

### MCP Tool Usage

**Direct Tool Call:**
```python
import asyncio
from mcp.client import ClientSession

async def scrape_reddit():
    result = await session.call_tool(
        "scrape_reddit_posts",
        {
            "product_name": "AirPods Pro",
            "sentiment": "negative"
        }
    )
    return result
```

---

## Search Strategy

### Reddit-Specific Query Construction

The server constructs targeted queries for Reddit:

```python
query = f"site:reddit.com {sentiment} {product_name} reddit posts discussions reviews"
```

**Example Queries:**
- `site:reddit.com positive iPhone 15 reddit posts discussions reviews`
- `site:reddit.com negative Tesla Model 3 reddit posts discussions reviews`

---

## Response Format

### Structured Output

**Main Sections:**
1. **Analysis** - Comprehensive Reddit sentiment analysis
2. **Reddit Sources** - Complete post attribution with metadata
3. **Research Metadata** - Search statistics and information

**Reddit Source Attribution:**
```markdown
### 1. iPhone 15 Camera Quality Discussion - r/apple
**Reddit User:** u/photographer_pro
**Posted:** March 15, 2024
**Reddit URL:** https://reddit.com/r/apple/comments/abc123
**Post Preview:** "The iPhone 15 Pro camera is absolutely incredible. The night mode improvements..."
```

### Metadata Included
- Product name and sentiment filter
- Number of Reddit posts found
- Search cost information (when available)
- Complete source URLs and usernames

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

## Error Handling

### Common Error Scenarios

**Missing API Key:**
```json
{"success": false, "error": "Please set EXA_API_KEY environment variable"}
```

**Invalid Sentiment:**
```json
{"success": false, "error": "Sentiment must be either 'positive' or 'negative'"}
```

**Search Failure:**
```json
{"success": false, "error": "Failed to search Reddit posts: Connection timeout"}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

---

## Use Cases

### Brand Monitoring
- Track Reddit sentiment for products
- Monitor community discussions and trends
- Identify emerging issues or praise

### Market Research
- Analyze competitor perception on Reddit
- Understand community preferences
- Gather authentic user feedback

### Product Development
- Learn from Reddit user complaints
- Identify desired features and improvements
- Track product reception over time

### Content Strategy
- Find Reddit success stories for marketing
- Identify common user pain points
- Understand community language and concerns

---

## Conclusion

The Reddit MCP Server provides a powerful, flexible solution for Reddit sentiment analysis and community insight gathering. Its multi-modal architecture supports both programmatic integration through MCP and web service access through REST API, making it suitable for diverse use cases from AI tool integration to web application backends.

**Key Strengths:**
- **Reddit-Focused**: Exclusively targets Reddit communities for authentic discussions
- **Multi-Modal**: Supports both MCP and HTTP interfaces
- **Sentiment-Aware**: Intelligent positive/negative filtering
- **Well-Attributed**: Complete source links and user information
- **Production-Ready**: Robust error handling and scalable architecture

Perfect for brand monitoring, market research, competitive analysis, and understanding authentic community sentiment about products and topics.
