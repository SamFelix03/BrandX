# Reviews MCP Server

## Overview

The **Reviews MCP Agent** is a system that combines **Model Context Protocol (MCP)**, **HTTP REST API**, and **Exa Research API** to provide comprehensive brand review analysis. The system intelligently scrapes and analyzes customer reviews from various platforms, providing sentiment-filtered insights for brands, products, and companies.

### Key Features
- **Multi-Mode Operation**: Supports both MCP (stdio) and HTTP API modes
- **Sentiment Analysis**: Filters reviews by positive or negative sentiment
- **Comprehensive Scraping**: Analyzes reviews from multiple platforms simultaneously
- **Intelligent Client Agents**: ASI:One powered agents for intelligent query processing
- **Real-time Communication**: Supports both synchronous and asynchronous operations
- **Cross-Platform Support**: Works with various review platforms and sources
- **Flexible Deployment**: Can run as standalone server or integrated service

### System Components
1. **MCP Server** (`mcpserver.py`): Core review scraping engine
2. **Positive Reviews Agent** (`positivereviewsagent.py`): Specialized for positive sentiment
3. **Negative Reviews Agent** (`negativereviewsagent.py`): Specialized for negative sentiment
4. **Test Suite**: Comprehensive testing framework
5. **Client Libraries**: Integration examples and utilities

---

## System Architecture

```
                    Reviews MCP Ecosystem                        
─────────────────────────────────────────────────────────────────
   User Query    ───▶   ASI:One AI    ───▶ Client Agents   
                      Reasoning            (Pos/Neg)       
                                                       │          
                                                       ▼          
   Final         ◀───   Response      ◀───   MCP Server    
   Response            Processing            (Core)       
                                                       │          
                                                       ▼          
   Review        ◀───   Data          ◀───   Exa Research  
   Analysis            Processing            API           
─────────────────────────────────────────────────────────────────
```

### Architecture Layers

1. **Presentation Layer**: Client agents with intelligent query processing
2. **Logic Layer**: MCP server with review scraping and analysis
3. **Data Layer**: Exa API integration for multi-source review collection
4. **Communication Layer**: HTTP REST API and MCP protocol support

---

## Core Components

### 1. MCP Server (`mcpserver.py`)

The central hub that handles review scraping operations with dual-mode support.

**Key Classes:**

#### `BrandReviewsScraper`
```python
class BrandReviewsScraper:
    def __init__(self):
        self.exa_api_key = EXA_API_KEY
        self.exa = Exa(self.exa_api_key)
```

**Core Methods:**
- `create_review_research_instructions(brand_name, sentiment)`: Generates comprehensive research prompts
- `search_reviews_with_exa(brand_name, sentiment)`: Executes review search using Exa SDK
- `scrape_reviews(brand_name, sentiment)`: Main workflow orchestrator

**Supported Sentiments:**
- **Positive**: High-rated reviews, testimonials, success stories, customer praise
- **Negative**: Low-rated reviews, complaints, critical feedback, issues

**Research Coverage:**
1. **Customer Reviews**: Google Reviews, Yelp, Trustpilot, Amazon, app stores
2. **Complaint Platforms**: Better Business Bureau, ConsumerAffairs
3. **Community Discussions**: Forums, YouTube comments (excluding Reddit)
4. **News Articles**: Customer experience mentions
5. **Industry Reviews**: Specialized review sites

### 2. Client Agents

#### Positive Reviews Agent (`positivereviewsagent.py`)
- **Port**: 8082
- **Endpoint**: `/reviews/positive`
- **Default Sentiment**: Positive
- **Focus**: Customer satisfaction, testimonials, success stories

#### Negative Reviews Agent (`negativereviewsagent.py`)
- **Port**: 8083
- **Endpoint**: `/reviews/negative`
- **Default Sentiment**: Negative
- **Focus**: Customer complaints, issues, critical feedback

**Shared Agent Features:**
- ASI:One powered intelligent query processing
- Automatic tool usage decision making
- Real-time chat protocol support
- REST API endpoints
- Comprehensive error handling

---

## Multi-Mode Operations

### 1. MCP Mode (Model Context Protocol)

**Purpose**: Direct integration with MCP-compatible clients
**Communication**: stdio (standard input/output)
**Use Case**: Tool integration, AI assistant plugins

**Activation:**
```bash
SERVER_MODE=mcp python mcpserver.py
```

**MCP Tools Available:**
```json
{
  "name": "scrape_brand_reviews",
  "description": "Scrape positive or negative reviews for any brand",
  "parameters": {
    "brand_name": "string",
    "sentiment": "enum[positive, negative]"
  }
}
```

### 2. HTTP API Mode

**Purpose**: RESTful web service for HTTP clients
**Communication**: HTTP requests/responses
**Use Case**: Web applications, microservices, external integrations

**Activation:**
```bash
SERVER_MODE=http python mcpserver.py
```

**HTTP Endpoints:**
- `GET /`: API information and documentation
- `POST /scrape-reviews`: Main review scraping endpoint
- `HEAD /health`: Health check endpoint

### 3. Dual Mode

**Purpose**: Run both MCP and HTTP simultaneously
**Use Case**: Maximum compatibility and flexibility

**Activation:**
```bash
SERVER_MODE=both python mcpserver.py
```

---

## API Integration

### Exa Research API Integration

**Purpose**: Comprehensive web research and review collection

**Configuration:**
```python
from exa_py import Exa
exa = Exa(EXA_API_KEY)
```

**Research Method:**
```python
result = exa.answer(query, text=True)
```

**Response Structure:**
```json
{
  "answer": "Comprehensive analysis text",
  "citations": [
    {
      "id": "unique_id",
      "url": "source_url",
      "title": "Review title",
      "author": "Reviewer name",
      "publishedDate": "2024-01-15",
      "text": "Review content excerpt"
    }
  ]
}
```

### ASI:One API Integration (Client Agents)

**Purpose**: Intelligent query processing and tool usage decisions

**Configuration:**
```python
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}
```

**Decision Logic:**
- Analyzes user queries for review-related intent
- Determines appropriate sentiment filter
- Decides when to use review search tools
- Processes and formats results intelligently

---

## Workflow Process

### 1. Query Reception and Analysis

```
User Query → Client Agent → ASI:One Analysis → Tool Decision
```

**Decision Criteria:**
- **USE TOOL**: "Find negative reviews for Tesla", "Customer complaints about Apple"
- **DON'T USE**: "Tesla stock price", "Apple company history"

### 2. Review Search Execution

```
Tool Call → MCP Server → Exa API → Multi-Source Scraping → Results
```

**Search Process:**
1. **Query Construction**: Brand-specific, sentiment-filtered search query
2. **Multi-Source Analysis**: Simultaneous scraping across platforms
3. **Content Extraction**: Review text, ratings, metadata collection
4. **Citation Processing**: Source attribution and link preservation

### 3. Response Generation and Formatting

```
Raw Results → Data Processing → Response Formatting → Client Delivery
```

**Response Structure:**
- **Analysis Section**: Comprehensive review analysis
- **Sources Section**: Detailed citations with metadata
- **Metadata Section**: Search statistics and cost information

### Detailed Workflow Example

1. **User Query**: "Show me negative reviews for Nike shoes"
2. **ASI:One Analysis**: Identifies review request with negative sentiment
3. **Tool Activation**: Calls `search_reviews` with `brand_name="Nike"`, `sentiment="negative"`
4. **MCP Processing**: Generates comprehensive research instructions
5. **Exa Execution**: Searches across review platforms for Nike negative reviews
6. **Data Processing**: Extracts review quotes, ratings, sources
7. **Response Formatting**: Structures results with exact quotes and citations
8. **Client Delivery**: Returns formatted response to user

---

## Usage Examples

### 1. HTTP API Usage

**Basic Review Scraping:**
```bash
curl -X POST http://localhost:8000/scrape-reviews \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Tesla", "sentiment": "negative"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8000/scrape-reviews",
    json={
        "brand_name": "Apple iPhone",
        "sentiment": "positive"
    }
)

result = response.json()
print(result["data"])  # Review analysis
print(len(result["sources"]))  # Number of citations
```

### 2. Client Agent Usage

**Positive Reviews Agent:**
```bash
curl -X POST http://localhost:8082/reviews/positive \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Nike", "sentiment": "positive"}'
```

**Negative Reviews Agent:**
```bash
curl -X POST http://localhost:8083/reviews/negative \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Starbucks", "sentiment": "negative"}'
```

### 3. MCP Integration

**Tool Schema:**
```json
{
  "type": "function",
  "function": {
    "name": "scrape_brand_reviews",
    "description": "Scrape positive or negative reviews for any brand",
    "parameters": {
      "type": "object",
      "properties": {
        "brand_name": {"type": "string"},
        "sentiment": {"type": "string", "enum": ["positive", "negative"]}
      },
      "required": ["brand_name", "sentiment"]
    }
  }
}
```

### 4. Query Examples

**Queries that WILL trigger review search:**
- "Find negative reviews for Tesla"
- "What do customers complain about Apple products?"
- "Show me positive testimonials for Nike"
- "Customer satisfaction reviews for Starbucks"

---

## Client Agents

### Positive Reviews Agent

**Purpose**: Specialized for positive sentiment analysis and customer satisfaction insights

**Key Features:**
- Focuses on high-rated reviews (4-5 stars)
- Extracts customer testimonials and success stories
- Highlights positive brand aspects and features
- Identifies customer loyalty indicators

**Intelligent Response Format:**
- Exact review quotes with star ratings
- Reviewer names and dates when available
- Source platform identification
- Direct links to original reviews

**Example Response Structure:**
```
## Positive Reviews for Tesla

### Review 1
"Absolutely love my Model 3! Best car I've ever owned."
- Reviewer: John D.
- Rating: 5 stars
- Date: March 15, 2024
- Source: Tesla Owner's Club
- URL: https://example.com/review1

### Review 2
"Tesla's customer service went above and beyond..."
- Reviewer: Sarah M.
- Rating: 5 stars
- Date: March 10, 2024
- Source: Trustpilot
- URL: https://example.com/review2
```

### Negative Reviews Agent

**Purpose**: Specialized for negative sentiment analysis and customer complaint insights

**Key Features:**
- Focuses on low-rated reviews (1-2 stars)
- Extracts customer complaints and critical feedback
- Identifies recurring problems and pain points
- Analyzes service quality issues

**Critical Response Requirements:**
- **EXACT QUOTES ONLY**: No summaries or paraphrasing
- **Complete Source Attribution**: Platform, reviewer, date, rating
- **Authentic Customer Voice**: Preserves original language and tone
- **No Analysis or Interpretation**: Raw feedback presentation only

**Forbidden Actions:**
- Summarizing or grouping reviews by themes
- Providing analysis or conclusions
- Paraphrasing customer quotes
- Including positive reviews in negative searches

---

## Testing Suite

### 1. Simple Direct Testing (`simple_test.py`)

**Purpose**: Direct functionality testing without HTTP layer

```python
# Test NVIDIA negative reviews directly
scraper = BrandReviewsScraper()
result = scraper.scrape_reviews("NVIDIA", "negative")
```

**Features:**
- Direct scraper class testing
- Detailed result structure debugging
- Full response analysis
- Error handling verification

### 2. HTTP Endpoint Testing

#### Positive Reviews Testing (`test_positive_reviews_endpoint.py`)

**Test Coverage:**
- Multiple brand testing (Tesla, Apple, Nike, Starbucks)
- Default sentiment handling
- Different sentiment values
- Invalid request handling
- Connection error scenarios
- Timeout handling

**Test Execution:**
```bash
python test_positive_reviews_endpoint.py
```

#### Negative Reviews Testing (`test_negative_reviews_endpoint.py`)

**Test Coverage:**
- Multiple brand negative review testing
- Sentiment validation
- Error response handling
- Connection timeout testing
- Invalid data handling

**Test Execution:**
```bash
python test_negative_reviews_endpoint.py
```

### 3. Test Output Examples

**Successful Test Output:**
```
🧪 Testing Positive Reviews REST Endpoint
==================================================

🔍 Testing positive reviews for: Tesla
📤 Sending request to: http://localhost:8082/reviews/positive
📋 Request body: {
  "brand_name": "Tesla",
  "sentiment": "positive"
}
📥 Response status: 200
✅ Success: True
🏷️  Brand: Tesla
😊 Sentiment: positive
⏰ Timestamp: 2024-01-15T10:30:00Z
🤖 Agent Address: agent_address_here
📄 Reviews Result Length: 3500 characters
📝 Result Preview: Tesla owners consistently praise...
```

**Error Handling Test:**
```
❌ Connection Error: Make sure the agent is running on localhost:8082
⏰ Request Timeout: The review search took too long to complete
```

---

## Technical Deep Dive

### Review Research Instructions

The system generates comprehensive research instructions tailored to sentiment and brand:

**Positive Sentiment Instructions:**
```python
"""
Focus specifically on POSITIVE reviews, testimonials, and customer feedback.

Please gather and analyze:
1. POSITIVE CUSTOMER REVIEWS:
   - High-rated reviews from Google Reviews, Yelp, Trustpilot, Amazon
   - Customer testimonials and success stories
   - 4-5 star ratings and user-generated content

2. POSITIVE ASPECTS TO HIGHLIGHT:
   - What customers love most about the brand/products
   - Standout features and benefits mentioned repeatedly
   - Excellent customer service experiences
   - Product quality and reliability praise

3. SUCCESS STORIES:
   - Customer transformation stories
   - Problem-solving success cases
   - Long-term customer satisfaction examples
"""
```

**Negative Sentiment Instructions:**
```python
"""
Focus specifically on NEGATIVE reviews, complaints, and critical feedback.

Please gather and analyze:
1. NEGATIVE CUSTOMER REVIEWS:
   - Low-rated reviews from Google Reviews, Yelp, Trustpilot, Amazon
   - Customer complaints and negative experiences
   - 1-2 star ratings and complaint forums

2. COMMON COMPLAINTS AND ISSUES:
   - Most frequently mentioned problems
   - Product quality and reliability issues
   - Customer service complaints
   - Pricing and value concerns
"""
```

### Data Processing Pipeline

1. **Query Construction**
   - Brand name extraction and validation
   - Sentiment filter application
   - Search query optimization

2. **Multi-Source Scraping**
   - Parallel platform analysis
   - Review content extraction
   - Metadata preservation

3. **Citation Processing**
   - Source URL preservation
   - Author and date extraction
   - Rating and platform identification

4. **Response Formatting**
   - Structured markdown generation
   - Source attribution
   - Metadata compilation

---

## Conclusion

The Reviews MCP Agent represents a sophisticated approach to automated review analysis, combining the flexibility of multiple communication protocols with the power of AI-driven research. Its multi-modal architecture ensures compatibility with various integration scenarios while maintaining high-quality, authentic review analysis.

The system's intelligent client agents provide natural language interfaces that automatically determine when review research is needed, while the core MCP server delivers comprehensive, multi-source review analysis with proper attribution and citation.

Key strengths include:
- **Flexibility**: Multiple operation modes (MCP, HTTP, dual)
- **Intelligence**: ASI:One powered query understanding
- **Authenticity**: Exact quote preservation with source attribution
- **Comprehensiveness**: Multi-platform review aggregation
- **Scalability**: Stateless design with horizontal scaling support
