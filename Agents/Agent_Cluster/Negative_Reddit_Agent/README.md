# Negative Reddit Agent

## Overview

The **Negative Reddit Agent** is an AI-powered specialized agent that intelligently searches for and analyzes negative Reddit posts, discussions, and community sentiment about any product, brand, or company. Built on the uAgents framework and powered by ASI:One AI, it provides authentic Reddit community feedback with complete source attribution.

### Key Features
- **AI-Powered Intelligence**: Uses ASI:One to decide when Reddit research is needed
- **Reddit-Specific**: Exclusively focuses on Reddit posts and community discussions
- **Negative Sentiment**: Specialized for negative posts, complaints, and critical discussions
- **Authentic Community Voice**: Presents real Reddit user posts without summarization
- **Complete Attribution**: Includes usernames, subreddits, URLs, and upvote counts
- **Dual Interface**: Supports both chat protocol and REST API
- **Smart Formatting**: Single paragraph summaries for easy consumption

---

## System Architecture

```
                Negative Reddit Agent System                     
─────────────────────────────────────────────────────────────────
                                                                 
   User Query    ───▶   ASI:One AI    ───▶  Intelligence   
 "Reddit posts         Reasoning            Engine        
  about iPhone"        (asi1-mini)                           
                                 │                        │        
                                 ▼                        ▼        
   Tool Usage    ◀───   Decision      ───▶   Direct        
   Decision            Matrix               Response      
           │                                                       
           ▼                                                       
   Reddit MCP    ───▶   Subreddit     ───▶   Negative      
   Server Call          Scraping             Posts         
                                 │                        │        
                                 ▼                        ▼        
   Final         ◀───   Summary       ◀───   Community     
   Result              Generation          Analysis      
                                                                 
─────────────────────────────────────────────────────────────────
```

---

## Core Components

### Agent Configuration
```python
agent = Agent(
    name="brandx_negative_reddit_search_agent",
    port=8080,  # Unique port for Reddit operations
    seed="brandx negative reddit search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)
```

### RedditSearchAgent Class

**Primary Engine** for Reddit post analysis:

```python
class RedditSearchAgent:
    def __init__(self):
        self.reddit_endpoint = REDDIT_MCP_ENDPOINT
```

**Key Methods:**
- `search_reddit_posts(product_name, sentiment="negative")`: Executes Reddit search via MCP server
- `create_reddit_tool_schema()`: Defines tool schema for ASI:One integration
- `process_reddit_query(user_query)`: Main processing pipeline with AI intelligence

**Unique Features:**
- **Cloud Endpoint**: Uses Google Cloud Run Reddit MCP service
- **Single Paragraph Output**: Formats responses as concise summaries
- **Reddit-Only Focus**: Exclusively searches Reddit communities

### Data Models

**Request Model:**
```python
class RedditNegativeRequest(Model):
    product_name: str
    sentiment: str = "negative"  # Default to negative Reddit posts
```

**Response Model:**
```python
class RedditNegativeResponse(Model):
    success: bool
    product_name: str
    sentiment: str
    reddit_result: str
    timestamp: str
    agent_address: str
```

---

## Intelligent Query Processing

### ASI:One Integration

The agent uses **ASI:One's asi1-mini and asi1-extended models** for intelligent decision making:

**Decision Criteria:**
1. **Reddit Post Requests**: Does the query ask for Reddit posts, discussions, or threads?
2. **Product/Brand Focus**: Is the query about specific products, brands, or companies?
3. **Sentiment Analysis**: Are they looking for negative Reddit posts or discussions?
4. **Community Research**: Do they want Reddit community sentiment insights?

**Tool Usage Triggers (USE TOOL):**
- "Find negative Reddit posts for iPhone"
- "What do Reddit users discuss about Tesla?"
- "Show me Reddit threads about Nike products"
- "Reddit discussions for Starbucks"
- "What problems do Reddit users report with [product]?"

---

## API Integration

### ASI:One Configuration
```python
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}
```

**Model Usage:**
- **Initial Decision**: `asi1-mini` for efficient query analysis
- **Final Processing**: `asi1-extended` for comprehensive response generation

### Reddit MCP Server Integration
**Endpoint**: `https://redditmcp-739298578243.us-central1.run.app/scrape-reddit-posts`

**Request Format:**
```python
{
    "product_name": "iPhone 15",
    "sentiment": "negative"
}
```

---

## Usage Examples

### REST API Usage

**Basic Request:**
```bash
curl -X POST http://localhost:8080/reddit/negative \
  -H "Content-Type: application/json" \
  -d '{"product_name": "iPhone 15", "sentiment": "negative"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/reddit/negative",
    json={
        "product_name": "Tesla Model 3",
        "sentiment": "negative"
    }
)

result = response.json()
print(result["reddit_result"])  # Single paragraph summary
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/reddit/negative', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        product_name: 'MacBook Pro',
        sentiment: 'negative'
    })
});

const result = await response.json();
console.log(result.reddit_result);
```

### Chat Protocol Usage
```python
from uagents.contrib.protocols.chat import ChatMessage, TextContent

message = ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(
        type="text", 
        text="Find negative Reddit posts about Nintendo Switch"
    )]
)

await ctx.send(agent_address, message)
```

---

## 📊 REST API Endpoint

### POST /reddit/negative

**Request:**
```json
{
  "product_name": "string",
  "sentiment": "negative"  // Optional, defaults to "negative"
}
```

**Response:**
```json
{
  "success": true,
  "product_name": "iPhone 15",
  "sentiment": "negative",
  "reddit_result": "Reddit users frequently complain about iPhone 15's battery life issues, with multiple posts in r/iPhone and r/apple discussing how the battery drains faster than expected, especially when using camera features, and many users report that the phone gets uncomfortably warm during charging, while others mention connectivity problems with WiFi and Bluetooth that require frequent restarts to resolve, alongside complaints about the new USB-C port being loose and not holding cables securely.",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent1qw2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request (missing product_name)
- `500`: Internal Server Error

---

## Workflow Process

### Complete Request Flow

1. **Query Reception**
   - Receives user query via chat or REST API
   - Extracts text content and validates structure

2. **Intelligence Processing**
   - **ASI:One asi1-mini** analyzes query for Reddit-related intent
   - Decides whether to use Reddit search tool or respond directly
   - Applies Reddit-specific decision criteria

3. **Reddit Search** (if tool is used)
   - Extracts product name and sentiment from tool call
   - Sends POST request to cloud Reddit MCP server
   - Processes Reddit community data and discussions

4. **Response Generation**
   - **ASI:One asi1-extended** formats results into single paragraph
   - Summarizes all negative Reddit content cohesively
   - Returns streamlined response without formatting

### Example Flow
**Input**: "What do Reddit users complain about regarding AirPods?"
**Process**: Query Analysis → Tool Usage Decision → Cloud MCP Call → Paragraph Generation
**Output**: Single paragraph summarizing all negative Reddit discussions

---

## Configuration

### Environment Variables
```env
# Required
ASI_ONE_API_KEY=your_asi_one_key_here
AGENTVERSE_API_KEY=your_agentverse_key_here

# Optional (uses cloud service by default)
REDDIT_MCP=https://redditmcp-739298578243.us-central1.run.app/scrape-reddit-posts
```

### Agent Settings
- **Port**: 8080 (different from other review agents)
- **Name**: "asi_negative_reddit_search_agent"
- **Endpoint**: "http://localhost:8080/submit"
- **Default Sentiment**: "negative"

### ASI:One Model Configuration
```python
# Initial query analysis
"model": "asi1-mini"        # Fast, efficient decision making

# Final response generation  
"model": "asi1-extended"    # Comprehensive paragraph generation
```
---

## Response Examples

### Successful Response Format
```
Reddit users frequently express frustration with Tesla Model 3's build quality issues, particularly panel gaps and paint defects that many owners discover immediately after delivery, while numerous posts in r/teslamotors and r/electricvehicles detail problems with the car's touchscreen freezing and requiring hard resets, alongside widespread complaints about Tesla's customer service being unresponsive and service appointments taking weeks to schedule, with many users also reporting issues with the car's autopilot system making sudden unexpected movements that feel unsafe, and concerns about the vehicle's range being significantly lower than advertised especially in cold weather conditions.
```

### Error Response
```json
{
  "success": false,
  "product_name": "InvalidProduct",
  "sentiment": "negative",
  "reddit_result": "Error processing Reddit negative posts: Product not found in Reddit discussions",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent_address_here"
}
```

---

## Use Cases

### Brand Monitoring
- Track negative Reddit sentiment for products
- Monitor community complaints and issues
- Early detection of emerging problems

### Competitive Analysis
- Analyze competitor criticism on Reddit
- Understand community pain points
- Identify market opportunities

### Product Development
- Learn from Reddit user complaints
- Identify feature requests and improvements
- Track product reception in communities

### Crisis Management
- Rapid assessment of Reddit community sentiment
- Understanding scale and nature of issues
- Community response monitoring

---

## Advanced Features

### AI Model Optimization
- **Dual Model Strategy**: Fast decisions + comprehensive responses
- **Temperature Control**: Balanced creativity (0.3) for consistent output
- **Tool Choice Auto**: Intelligent autonomous decision making

### Response Optimization
- **Single Paragraph Format**: Perfect for executive summaries
- **No Formatting Overhead**: Clean text output for integration
- **Comprehensive Coverage**: All negative content in one cohesive summary

---

## Conclusion

The Negative Reddit Agent provides a unique, streamlined approach to Reddit sentiment analysis with its single-paragraph summary format and cloud-first architecture. Its AI-powered intelligence ensures efficient operation by only performing Reddit searches when truly needed, while its specialized negative sentiment focus makes it perfect for brand monitoring, competitive analysis, and issue identification.

**Key Strengths:**
- **Reddit-Specialized**: Exclusively focuses on Reddit community discussions
- **AI-Intelligent**: Smart query analysis and tool usage decisions
- **Summary Format**: Single paragraph outputs for easy consumption
- **Cloud-Powered**: Reliable Google Cloud Run backend
- **Dual Model**: Optimized ASI:One model usage for speed and quality

Perfect for organizations needing quick, comprehensive insights into Reddit community sentiment without the overhead of detailed quote attribution and formatting.
