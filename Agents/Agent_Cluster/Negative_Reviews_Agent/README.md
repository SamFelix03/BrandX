# Negative Reviews Agent

## Overview

The **Negative Reviews Agent** intelligently identifies, searches, and presents negative customer reviews and complaints for any brand, product, or company. Built on the uAgents framework and powered by ASI:One AI, it provides authentic, unfiltered customer feedback with complete source attribution.

### Key Features
- **AI-Powered Intelligence**: Uses ASI:One to decide when negative review research is needed
- **Sentiment-Specific**: Exclusively focuses on negative reviews and customer complaints
- **Authentic Quotes**: Presents exact customer review quotes without summarization
- **Complete Attribution**: Includes reviewer names, ratings, dates, and source links
- **Multi-Platform**: Searches across Google Reviews, Yelp, Trustpilot, Amazon, and more
- **Dual Interface**: Supports both chat protocol and REST API
- **Zero Interpretation**: Raw customer voices without analysis or themes
- **Real-Time Processing**: Live integration with Reviews MCP server

### Core Purpose
This agent serves as a critical tool for:
- **Brand Monitoring**: Understanding customer dissatisfaction and complaints
- **Reputation Management**: Identifying recurring issues and pain points
- **Competitive Analysis**: Analyzing competitor weaknesses through customer feedback
- **Product Development**: Learning from customer criticism and suggestions
- **Crisis Management**: Early detection of emerging brand issues

---

## System Architecture

```
                 Negative Reviews Agent Ecosystem                
─────────────────────────────────────────────────────────────────
                                                                 
   User Query    ───▶   ASI:One AI    ───▶  Intelligence   
  "Find bad            Reasoning            Engine        
   reviews..."          Engine                               
                                 │                        │        
                                 ▼                        ▼        
   Tool Usage    ◀───   Decision      ───▶   Direct        
   Decision            Matrix               Response      
           │                                                       
           ▼                                                       
   Reviews MCP   ───▶   Multi-Source  ───▶   Raw Review    
   Server Call          Scraping             Collection    
                                 │                        │        
                                 ▼                        ▼        
   Final User    ◀───   Quote         ◀───   Source        
   Response            Extraction          Attribution   
                                                                 
─────────────────────────────────────────────────────────────────
```

### Architecture Layers

1. **Intelligence Layer**: ASI:One powered query analysis and decision making
2. **Communication Layer**: uAgents framework with chat and REST protocols
3. **Integration Layer**: Reviews MCP server connection and data retrieval
4. **Processing Layer**: Quote extraction and source attribution
5. **Presentation Layer**: Formatted response delivery

---

## Core Components Deep Dive

### 1. Agent Configuration

```python
agent = Agent(
    name="brandx_negative_reviews_search_agent",
    port=8080,  # Unique port for negative reviews
    seed="brandx negative reviews search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8083/submit"]
)
```

**Configuration Details:**
- **Name**: Unique identifier for the negative reviews specialization
- **Port**: 8083
- **Seed**: Cryptographic seed for consistent agent identity
- **Mailbox**: Enables message queuing and handling
- **Endpoint**: HTTP communication endpoint

### 2. ReviewsSearchAgent Class

The core intelligence engine that handles all review search operations.

#### Constructor
```python
class ReviewsSearchAgent:
    def __init__(self):
        self.reviews_endpoint = REVIEWS_MCP_ENDPOINT
```

**Key Attributes:**
- `reviews_endpoint`: Connection to Reviews MCP server (default: `http://0.0.0.0:8000/scrape-reviews`)

#### Core Methods

##### `search_reviews(brand_name, sentiment="negative")`
**Purpose**: Executes the actual review search by calling the MCP server

**Parameters:**
- `brand_name` (str): Brand/company/product to search reviews for
- `sentiment` (str): Review sentiment filter (defaults to "negative")

**Process Flow:**
1. **Request Preparation**: Creates JSON payload with brand name and sentiment
2. **HTTP Communication**: Sends POST request to Reviews MCP server
3. **Response Processing**: Handles success/error responses
4. **Data Structuring**: Returns structured result with success status

**Return Structure:**
```python
{
    "success": True/False,
    "data": reviews_data,  # Raw MCP server response
    "brand_name": brand_name,
    "sentiment": sentiment,
    "error": error_message  # Only on failure
}
```

##### `create_reviews_tool_schema()`
**Purpose**: Defines the tool schema for ASI:One integration

**Tool Definition:**
```python
{
    "type": "function",
    "function": {
        "name": "search_reviews",
        "description": "Search for brand reviews with specific sentiment analysis...",
        "parameters": {
            "type": "object",
            "properties": {
                "brand_name": {"type": "string"},
                "sentiment": {
                    "type": "string",
                    "enum": ["positive", "negative"],
                    "default": "negative"
                }
            },
            "required": ["brand_name"]
        }
    }
}
```

##### `process_reviews_query(user_query)`
**Purpose**: Main processing pipeline that handles user queries with AI intelligence

**Process Steps:**
1. **Tool Schema Creation**: Prepares the search tool for ASI:One
2. **System Prompt Setup**: Configures AI behavior and response requirements
3. **Initial AI Request**: Sends query to ASI:One for tool usage decision
4. **Tool Call Processing**: Executes review search if AI decides to use tool
5. **Final Response Generation**: Gets AI-processed response with review quotes

### 3. Data Models

#### NegativeReviewsRequest
```python
class NegativeReviewsRequest(Model):
    brand_name: str
    sentiment: str = "negative"  # Default to negative reviews
```

#### NegativeReviewsResponse
```python
class NegativeReviewsResponse(Model):
    success: bool
    brand_name: str
    sentiment: str
    reviews_result: str
    timestamp: str
    agent_address: str
```

### 4. Protocol Handlers

#### Startup Handler
```python
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"ASI:One Negative Reviews Search Agent started with address: {ctx.agent.address}")
    ctx.logger.info(f"Reviews endpoint configured: {REVIEWS_MCP_ENDPOINT}")
    ctx.logger.info("Agent is ready to intelligently search for negative brand reviews using ASI:One!")
```

**Initialization Tasks:**
- Logs agent address and configuration
- Confirms MCP endpoint connectivity
- Announces readiness status

#### Message Handler
```python
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
```

**Message Processing:**
1. **Content Extraction**: Extracts text from ChatMessage
2. **Query Processing**: Calls `process_reviews_query()`
3. **Response Formatting**: Creates ChatMessage response
4. **Error Handling**: Manages exceptions and error responses

#### REST API Handler
```python
@agent.on_rest_post("/reviews/negative", NegativeReviewsRequest, NegativeReviewsResponse)
async def handle_negative_reviews(ctx: Context, req: NegativeReviewsRequest):
```

**REST Processing:**
1. **Request Validation**: Validates incoming request structure
2. **Query Construction**: Creates appropriate search query
3. **Processing Execution**: Calls review processing pipeline
4. **Response Construction**: Returns structured response

---

## Intelligent Query Processing

### ASI:One Integration

The agent uses ASI:One's advanced reasoning capabilities to make intelligent decisions about when to search for negative reviews.

#### System Prompt Analysis

The agent uses a comprehensive system prompt that defines:

**Decision Criteria:**
1. **Review Requests**: Does the query ask for reviews, testimonials, or customer feedback?
2. **Brand/Product Focus**: Is the query about specific brands, companies, or products?
3. **Sentiment Analysis**: Are they looking for negative reviews specifically?
4. **Reputation Research**: Do they want to understand customer dissatisfaction or brand issues?

**Tool Usage Triggers (USE TOOL):**
- "Find negative reviews for Tesla"
- "What do customers complain about Apple products?"
- "Show me bad reviews for Nike shoes"
- "Customer complaints for Starbucks"
- "What problems do users report with [brand]?"

### Intelligence Engine Workflow

```
User Query → ASI:One Analysis → Decision Matrix → Action Selection
     ↓              ↓               ↓              ↓
"Find bad      Analyzes for     Determines      Tool Call OR
 reviews"      review intent    tool needed     Direct Answer
     ↓              ↓               ↓              ↓
Tool Execution → MCP Server → Review Search → Quote Extraction
     ↓              ↓               ↓              ↓
Raw Results → ASI:One Processing → Format Quotes → User Response
```

---

## API Integration

### ASI:One API Configuration

```python
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}
```

**Request Structure:**
```python
payload = {
    "model": "asi1-extended",
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ],
    "tools": [reviews_tool],
    "tool_choice": "auto",  # Intelligent decision making
    "temperature": 0.3      # Controlled creativity
}
```

**Tool Call Processing:**
1. **Tool Detection**: Checks if ASI:One decided to use the search tool
2. **Argument Parsing**: Extracts brand_name and sentiment from tool call
3. **Search Execution**: Calls MCP server with extracted parameters
4. **Result Integration**: Adds search results to conversation context
5. **Final Processing**: Gets AI-generated response with formatted quotes

### Reviews MCP Server Integration

**Endpoint**: Configurable via `REVIEWS_MCP_ENDPOINT` environment variable
**Default**: `http://0.0.0.0:8000/scrape-reviews`

**Request Format:**
```python
{
    "brand_name": "Tesla",
    "sentiment": "negative"
}
```

**Response Processing:**
- Handles HTTP status codes (200 success, 4xx/5xx errors)
- Processes JSON response data
- Manages connection timeouts and network errors
- Provides detailed error logging

---

## Workflow Process

### Complete Request Lifecycle

#### 1. Query Reception Phase
```
User Input → Agent → Message/Request Parsing → Text Extraction
```

**Chat Protocol:**
- Receives `ChatMessage` objects
- Extracts `TextContent` from message content
- Validates message structure

**REST API:**
- Receives `NegativeReviewsRequest` objects
- Validates request parameters
- Constructs query string

#### 2. Intelligence Processing Phase
```
Query Text → ASI:One → System Prompt → Decision Analysis → Tool Choice
```

**ASI:One Processing:**
1. **Context Setup**: Loads system prompt with decision criteria
2. **Query Analysis**: Analyzes user intent and requirements
3. **Tool Evaluation**: Decides if review search is needed
4. **Response Strategy**: Chooses between tool usage or direct response

#### 3. Review Search Phase (if tool is used)
```
Tool Call → MCP Server → Multi-Source Search → Data Collection → Response
```

**Search Execution:**
1. **Parameter Extraction**: Gets brand_name and sentiment from tool call
2. **HTTP Request**: Sends POST request to Reviews MCP server
3. **Response Handling**: Processes success/error responses
4. **Data Validation**: Ensures response structure integrity

#### 4. Response Generation Phase
```
Search Results → ASI:One → Quote Extraction → Formatting → User Delivery
```

**Response Processing:**
1. **Context Integration**: Adds search results to conversation
2. **Final AI Request**: Gets formatted response from ASI:One
3. **Quote Extraction**: AI extracts exact quotes with attribution
4. **Response Formatting**: Structures final response for user

### Example Complete Workflow

**Input**: "Show me negative reviews for Tesla"

**Step 1 - Reception**:
- Agent receives query via chat or REST
- Extracts text: "Show me negative reviews for Tesla"

**Step 2 - Intelligence**:
- ASI:One analyzes query
- Identifies: Brand="Tesla", Intent="negative reviews"
- Decision: USE TOOL (matches review request criteria)

**Step 3 - Search**:
- Tool call: `search_reviews(brand_name="Tesla", sentiment="negative")`
- MCP server request: `{"brand_name": "Tesla", "sentiment": "negative"}`
- MCP server searches multiple platforms for Tesla negative reviews

**Step 4 - Response**:
- ASI:One receives search results
- Extracts exact customer quotes
- Formats with complete attribution
- Returns structured response with individual review entries

**Output Example**:
```
### Negative Review 1
"Worst car buying experience ever. Service is terrible and they don't care about customers."
- Reviewer: John D.
- Rating: 1 star
- Date: March 15, 2024
- Source: Google Reviews
- URL: https://example.com/review1

### Negative Review 2
"My Model 3 has been in the shop 6 times in 8 months. Quality control is non-existent."
- Reviewer: Sarah M.
- Rating: 2 stars
- Date: March 10, 2024
- Source: Trustpilot
- URL: https://example.com/review2
```

---

## Usage Examples

### 1. REST API Usage

#### Basic Negative Reviews Request
```bash
curl -X POST http://localhost:8083/reviews/negative \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Tesla",
    "sentiment": "negative"
  }'
```

#### Python Client Example
```python
import requests
import json

def get_negative_reviews(brand_name):
    url = "http://localhost:8083/reviews/negative"
    payload = {
        "brand_name": brand_name,
        "sentiment": "negative"
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Success: {result['success']}")
        print(f"Brand: {result['brand_name']}")
        print(f"Sentiment: {result['sentiment']}")
        print(f"Reviews:\n{result['reviews_result']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

# Usage
get_negative_reviews("Apple iPhone")
```

#### JavaScript Client Example
```javascript
async function getNegativeReviews(brandName) {
    const url = 'http://localhost:8083/reviews/negative';
    const payload = {
        brand_name: brandName,
        sentiment: 'negative'
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`Negative reviews for ${result.brand_name}:`);
            console.log(result.reviews_result);
        } else {
            console.error('Error:', result.reviews_result);
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
}

// Usage
getNegativeReviews('Nike');
```

### 2. Chat Protocol Usage

#### uAgents Integration
```python
from uagents import Agent, Context
from uagents.contrib.protocols.chat import ChatMessage, TextContent

# Send message to negative reviews agent
async def send_review_request(ctx: Context, agent_address: str, brand: str):
    message = ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=[TextContent(
            type="text", 
            text=f"Find negative reviews for {brand}"
        )]
    )
    
    await ctx.send(agent_address, message)

# Usage
await send_review_request(ctx, "agent_address_here", "Starbucks")
```

### 3. Query Examples

#### Queries That WILL Trigger Review Search
```
"Find negative reviews for Tesla"
"What do customers complain about Apple products?"
"Show me bad reviews for Nike shoes"
"Customer complaints about Starbucks service"
"What problems do users report with Microsoft products?"
"Negative feedback about Amazon delivery"
"Critical reviews of Samsung phones"
"What issues do customers have with Uber?"
```

### 4. Response Format Examples

#### Typical Successful Response
```json
{
  "success": true,
  "brand_name": "Tesla",
  "sentiment": "negative",
  "reviews_result": "### Negative Review 1\n\"Terrible customer service experience. They kept my car for 3 weeks and couldn't fix the issue.\"\n- Reviewer: Mike R.\n- Rating: 1 star\n- Date: March 20, 2024\n- Source: Google Reviews\n- URL: https://maps.google.com/review123\n\n### Negative Review 2\n\"Quality control is non-existent. Paint defects, panel gaps, and interior issues from day one.\"\n- Reviewer: Jennifer L.\n- Rating: 2 stars\n- Date: March 18, 2024\n- Source: Trustpilot\n- URL: https://trustpilot.com/review456",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent1qw2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6"
}
```

#### Error Response Example
```json
{
  "success": false,
  "brand_name": "InvalidBrand",
  "sentiment": "negative",
  "reviews_result": "Error processing negative reviews for InvalidBrand: Reviews API error: 400 - Brand not found",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent1qw2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6"
}
```

---

## Conclusion

The Negative Reviews Agent represents a sophisticated approach to automated customer feedback analysis, specifically designed to surface authentic negative experiences and complaints. Its intelligent decision-making capabilities ensure that review research is only performed when truly needed, while its strict formatting requirements preserve the authentic voice of customer complaints.

### Key Strengths

1. **Intelligence**: ASI:One powered query understanding eliminates false positives
2. **Authenticity**: Exact quote preservation maintains customer voice integrity
3. **Completeness**: Full source attribution enables verification and follow-up
4. **Specialization**: Focused exclusively on negative sentiment for targeted insights
5. **Integration**: Multiple communication protocols support diverse use cases
6. **Reliability**: Comprehensive error handling and testing ensure consistent operation

### Use Cases

- **Brand Monitoring**: Continuous monitoring of customer dissatisfaction
- **Competitive Analysis**: Understanding competitor weaknesses through customer complaints
- **Product Development**: Learning from customer criticism to improve offerings
- **Crisis Management**: Early detection of emerging brand reputation issues
- **Customer Service**: Identifying systemic issues requiring attention

The agent's focus on presenting unfiltered, attributed customer complaints makes it an invaluable tool for organizations seeking to understand and address customer dissatisfaction proactively.
