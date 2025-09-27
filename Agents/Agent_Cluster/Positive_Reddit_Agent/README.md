# Positive Reddit Agent

## Overview

The **Positive Reddit Agent** searches for and analyzes positive Reddit posts, discussions, and community praise about any product, brand, or company. Built on the uAgents framework and powered by ASI:One AI, it provides authentic Reddit community testimonials with complete source attribution.

### Key Features
- **AI-Powered Intelligence**: Uses ASI:One to decide when Reddit research is needed
- **Reddit-Specific**: Exclusively focuses on Reddit posts and community discussions
- **Positive Sentiment**: Specialized for positive posts, praise, and success stories
- **Authentic Community Voice**: Presents real Reddit user posts without summarization
- **Complete Attribution**: Includes usernames, subreddits, URLs, and upvote counts
- **Dual Interface**: Supports both chat protocol and REST API
- **Smart Formatting**: Single paragraph summaries for easy consumption

---

## System Architecture

```
                Positive Reddit Agent System                     
─────────────────────────────────────────────────────────────────
                                                                 
   User Query    ───▶   ASI:One AI    ───▶  Intelligence   
 "Reddit praise        Reasoning            Engine        
  for Tesla"            (asi1-mini)                           
                                 │                        │        
                                 ▼                        ▼        
   Tool Usage    ◀───   Decision      ───▶   Direct        
   Decision            Matrix               Response      
           │                                                       
           ▼                                                       
   Reddit MCP    ───▶   Subreddit     ───▶   Positive      
   Server Call          Scraping             Posts         
                                 │                        │        
                                 ▼                        ▼        
   Single        ◀───   Summary       ◀───   Community     
   Paragraph           Generation          Analysis      
                                                                 
─────────────────────────────────────────────────────────────────
```

---

## Core Components

### Agent Configuration
```python
agent = Agent(
    name="asi_positive_reddit_search_agent",
    port=8080,  # Same port as negative agent (different endpoints)
    seed="asi positive reddit search agent seed",
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
- `search_reddit_posts(product_name, sentiment="positive")`: Executes Reddit search via MCP server
- `create_reddit_tool_schema()`: Defines tool schema for ASI:One integration
- `process_reddit_query(user_query)`: Main processing pipeline with AI intelligence

**Unique Features:**
- **Cloud Endpoint**: Uses a custom Reddit MCP service built by us
- **Single Paragraph Output**: Formats responses as concise positive summaries
- **Reddit-Only Focus**: Exclusively searches Reddit communities

### Data Models

**Request Model:**
```python
class RedditPositiveRequest(Model):
    product_name: str
    sentiment: str = "positive"  # Default to positive Reddit posts
```

**Response Model:**
```python
class RedditPositiveResponse(Model):
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
3. **Sentiment Analysis**: Are they looking for positive Reddit posts or discussions?
4. **Community Research**: Do they want Reddit community sentiment insights?

**Tool Usage Triggers (USE TOOL):**
- "Find positive Reddit posts for iPhone"
- "What do Reddit users discuss about Tesla?"
- "Show me Reddit threads about Nike products"
- "Reddit discussions for Starbucks"
- "What do Reddit users love about [product]?"

### Unique Response Format

**Special Formatting Requirement:**
> **MOST IMPORTANT**: Talk about all the positive content obtained from the reddit post in a **SINGLE large paragraph**, nothing more. No extra line breaks, no emojis, no nothing. Just a single paragraph.

This makes the agent perfect for:
- **Executive summaries** of Reddit positive sentiment
- **Marketing insights** for brand promotion
- **Success story compilation** for testimonials
- **Integration** with other systems expecting paragraph format

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

**Key Features:**
- **Scalable**: Handles concurrent requests efficiently
- **Reddit-Focused**: Exclusively searches Reddit.com and subreddits

**Request Format:**
```python
{
    "product_name": "iPhone 15",
    "sentiment": "positive"
}
```

---

## Usage Examples

### REST API Usage

**Basic Request:**
```bash
curl -X POST http://localhost:8080/reddit/positive \
  -H "Content-Type: application/json" \
  -d '{"product_name": "iPhone 15", "sentiment": "positive"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/reddit/positive",
    json={
        "product_name": "Tesla Model 3",
        "sentiment": "positive"
    }
)

result = response.json()
print(result["reddit_result"])  # Single paragraph summary
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/reddit/positive', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        product_name: 'MacBook Pro',
        sentiment: 'positive'
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
        text="Find positive Reddit posts about Nintendo Switch"
    )]
)

await ctx.send(agent_address, message)
```

---

## REST API Endpoint

### POST /reddit/positive

**Request:**
```json
{
  "product_name": "string",
  "sentiment": "positive"  // Optional, defaults to "positive"
}
```

**Response:**
```json
{
  "success": true,
  "product_name": "iPhone 15",
  "sentiment": "positive",
  "reddit_result": "Reddit users consistently praise the iPhone 15's camera quality and battery life improvements, with numerous posts in r/iPhone and r/apple highlighting the exceptional photo quality especially in low light conditions, while many users express satisfaction with the new USB-C port and faster charging speeds, and community members frequently recommend the device for its build quality and iOS performance, with several posts in r/photography showcasing impressive shots taken with the device and users sharing positive experiences about the phone's durability and premium feel.",
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
   - Summarizes all positive Reddit content cohesively
   - Returns streamlined response without formatting

### Example Flow
**Input**: "What do Reddit users love about AirPods?"
**Process**: Query Analysis → Tool Usage Decision → Cloud MCP Call → Paragraph Generation
**Output**: Single paragraph summarizing all positive Reddit discussions

---

## Response Examples

### Successful Response Format
```
Reddit users consistently express enthusiasm for the Tesla Model 3's performance and technology features, with numerous posts in r/teslamotors and r/electricvehicles praising the car's acceleration and smooth driving experience, while many owners share positive experiences about the vehicle's autopilot capabilities and over-the-air software updates that continuously improve functionality, and community members frequently highlight the car's impressive range and the convenience of Tesla's Supercharger network, with several posts showcasing road trip experiences and users expressing satisfaction with the vehicle's build quality improvements and the responsive touchscreen interface that controls most car functions.
```

### Error Response
```json
{
  "success": false,
  "product_name": "InvalidProduct",
  "sentiment": "positive",
  "reddit_result": "Error processing Reddit positive posts: Product not found in Reddit discussions",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent_address_here"
}
```

---

## Use Cases

### Brand Promotion
- Collect positive Reddit testimonials for marketing
- Identify community success stories and praise
- Gather authentic user endorsements

### Product Marketing
- Find Reddit-based product recommendations
- Collect community-driven success stories
- Identify popular features and benefits

### Reputation Building
- Showcase positive community sentiment
- Highlight user satisfaction and loyalty
- Demonstrate product value through user voices

### Competitive Analysis
- Understand what users love about competitors
- Identify market opportunities and strengths
- Benchmark positive sentiment across brands

---

## Advanced Features

### Cloud-First Architecture
- **No Local Dependencies**: Uses cloud Reddit MCP service
- **High Availability**: Google Cloud Run reliability
- **Auto-Scaling**: Handles traffic spikes automatically

### AI Model Optimization
- **Dual Model Strategy**: Fast decisions + comprehensive responses
- **Temperature Control**: Balanced creativity (0.3) for consistent output
- **Tool Choice Auto**: Intelligent autonomous decision making

### Response Optimization
- **Single Paragraph Format**: Perfect for marketing summaries
- **No Formatting Overhead**: Clean text output for integration
- **Comprehensive Coverage**: All positive content in one cohesive summary

---

## Conclusion

The Positive Reddit Agent provides a unique, streamlined approach to Reddit sentiment analysis with its single-paragraph summary format and cloud-first architecture. Its AI-powered intelligence ensures efficient operation by only performing Reddit searches when truly needed, while its specialized positive sentiment focus makes it perfect for brand promotion, marketing insights, and reputation building.

**Key Strengths:**
- **Reddit-Specialized**: Exclusively focuses on Reddit community discussions
- **Positive-Focused**: Filters for praise, success stories, and testimonials
- **AI-Intelligent**: Smart query analysis and tool usage decisions
- **Summary Format**: Single paragraph outputs for marketing use
- **Dual Model**: Optimized ASI:One model usage for speed and quality

Perfect for marketing teams, brand managers, and organizations seeking authentic community testimonials and positive sentiment insights from Reddit without the complexity of detailed quote attribution and formatting.
