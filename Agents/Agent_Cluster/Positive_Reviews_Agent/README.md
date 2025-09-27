# Positive Reviews Agent

## Overview

The **Positive Reviews Agent** searches for and presents positive customer reviews, testimonials, and satisfaction feedback for any brand, product, or company. Built on the uAgents framework and powered by ASI:One AI, it provides authentic customer praise with complete source attribution.

### Key Features
- **AI-Powered Intelligence**: Uses ASI:One to decide when positive review research is needed
- **Sentiment-Specific**: Exclusively focuses on positive reviews and customer testimonials
- **Authentic Quotes**: Presents exact customer review quotes without summarization
- **Complete Attribution**: Includes reviewer names, ratings, dates, and source links
- **Multi-Platform**: Searches across Google Reviews, Yelp, Trustpilot, Amazon, and more
- **Dual Interface**: Supports both chat protocol and REST API
- **Zero Interpretation**: Raw customer voices without analysis or themes

---

## System Architecture

```
User Query → ASI:One Intelligence → Decision Engine → Tool Usage/Direct Response
     ↓              ↓                    ↓               ↓
Review Search → MCP Server → Multi-Platform Scraping → Quote Extraction
     ↓              ↓                    ↓               ↓
Raw Results → Response Processing → Formatted Quotes → User Delivery
```

---

## Core Components

### Agent Configuration
```python
agent = Agent(
    name="asi_reviews_search_agent",
    port=8080,  # Unique port for positive reviews
    seed="asi reviews search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)
```

### ReviewsSearchAgent Class

**Main Methods:**
- `search_reviews(brand_name, sentiment="positive")`: Executes review search via MCP server
- `create_reviews_tool_schema()`: Defines tool schema for ASI:One integration
- `process_reviews_query(user_query)`: Main processing pipeline with AI intelligence

**Key Features:**
- Connects to Reviews MCP server at configurable endpoint
- Handles HTTP communication with error management
- Structures responses with success/error status

### Data Models

**Request Model:**
```python
class PositiveReviewsRequest(Model):
    brand_name: str
    sentiment: str = "positive"  # Default to positive reviews
```

**Response Model:**
```python
class PositiveReviewsResponse(Model):
    success: bool
    brand_name: str
    sentiment: str
    reviews_result: str
    timestamp: str
    agent_address: str
```

---

## Intelligent Query Processing

### ASI:One Decision Making

The agent uses ASI:One's reasoning to intelligently decide when to search for positive reviews:

**Tool Usage Triggers (USE TOOL):**
- "Find positive reviews for Tesla"
- "What do customers say about Apple products?"
- "Show me good reviews for Nike shoes"
- "Customer testimonials for Starbucks"
- "What do people love about [brand]?"

### Response Format Requirements

**MANDATORY Format:**
1. **Extract exact review quotes** - word-for-word from sources
2. **Include complete attribution**:
   - Reviewer name (if available)
   - Star rating (e.g., "4 stars", "5 stars")
   - Review date (if available)
   - Source platform (Trustpilot, Amazon, Google Reviews, etc.)
   - Direct source link/URL (if provided)
3. **Present as separate entries** - each review individually formatted
4. **Use authentic customer language** - no paraphrasing or summarization

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

### Reviews MCP Server Integration
**Endpoint**: `http://0.0.0.0:8000/scrape-reviews` (configurable)

**Request Format:**
```python
{
    "brand_name": "Tesla",
    "sentiment": "positive"
}
```

---

## Usage Examples

### REST API Usage

**Basic Request:**
```bash
curl -X POST http://localhost:8080/reviews/positive \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Tesla", "sentiment": "positive"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/reviews/positive",
    json={"brand_name": "Apple iPhone", "sentiment": "positive"}
)

result = response.json()
print(result["reviews_result"])
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/reviews/positive', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({brand_name: 'Nike', sentiment: 'positive'})
});

const result = await response.json();
console.log(result.reviews_result);
```

### Chat Protocol Usage
```python
from uagents.contrib.protocols.chat import ChatMessage, TextContent

message = ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text="Find positive reviews for Starbucks")]
)

await ctx.send(agent_address, message)
```

---

## REST API Endpoint

### POST /reviews/positive

**Request:**
```json
{
  "brand_name": "string",
  "sentiment": "positive"  // Optional, defaults to "positive"
}
```

**Response:**
```json
{
  "success": true,
  "brand_name": "Tesla",
  "sentiment": "positive",
  "reviews_result": "### Positive Review 1\n\"Amazing car! Best purchase I've ever made.\"\n- Reviewer: John D.\n- Rating: 5 stars\n- Date: March 20, 2024\n- Source: Google Reviews\n- URL: https://maps.google.com/review123",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent1qw2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request (missing brand_name)
- `500`: Internal Server Error

---

## Workflow Process

### Complete Request Flow

1. **Query Reception**
   - Receives user query via chat or REST API
   - Extracts text content and validates structure

2. **Intelligence Processing**
   - ASI:One analyzes query for review-related intent
   - Decides whether to use review search tool or respond directly
   - Applies decision criteria based on query characteristics

3. **Review Search** (if tool is used)
   - Extracts brand name and sentiment from tool call
   - Sends POST request to Reviews MCP server
   - Processes response and handles errors

4. **Response Generation**
   - ASI:One formats search results into exact quotes
   - Includes complete source attribution for each review
   - Returns structured response to user

### Example Flow
**Input**: "Show me positive reviews for Tesla"
**Process**: Query Analysis → Tool Usage Decision → MCP Server Call → Quote Extraction
**Output**: Individual review quotes with complete attribution

---

## Response Examples

### Successful Response Format
```
### Positive Review 1
"Absolutely love my Tesla Model 3! Best car I've ever owned. The technology is incredible."
- Reviewer: Sarah M.
- Rating: 5 stars
- Date: March 15, 2024
- Source: Trustpilot
- URL: https://trustpilot.com/review123

### Positive Review 2
"Outstanding customer service and amazing product quality. Highly recommend!"
- Reviewer: Mike R.
- Rating: 5 stars
- Date: March 10, 2024
- Source: Google Reviews
- URL: https://maps.google.com/review456
```

### Error Response
```json
{
  "success": false,
  "brand_name": "InvalidBrand",
  "sentiment": "positive",
  "reviews_result": "Error processing positive reviews: Brand not found",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent_address_here"
}
```

---

## Testing

### Quick Test
```bash
# Test agent responsiveness
curl -X POST http://localhost:8080/reviews/positive \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Apple"}' \
  --max-time 60
```

### Validation Criteria
- HTTP 200 response status
- `success: true` in response
- Correct brand name echoed back
- Sentiment set to "positive"
- Non-empty reviews_result with quotes
- Valid timestamp and agent address

---

## Conclusion

The Positive Reviews Agent provides intelligent, authentic customer testimonial extraction with complete source attribution. Its AI-powered decision making ensures efficient operation, while its strict formatting requirements preserve the authentic voice of satisfied customers. Perfect for brand promotion, reputation management, and customer satisfaction analysis.
