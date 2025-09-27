# Positive Social Agent

## Overview

The **Positive Social Agent** searches for and analyzes positive Social comments and community feedback about any brand or company. Built on the uAgents framework and powered by ASI:One AI, it provides authentic Instagram community praise with intelligent analysis and single-paragraph summaries perfect for marketing campaigns.

### Key Features
- **AI-Powered Intelligence**: Uses ASI:One to decide when Social Media research is needed
- **Social Media-Focused**: Exclusively analyzes Social Media comments from brand official accounts
- **Positive Sentiment**: Specialized for praise, testimonials, and positive feedback
- **Intelligent Analysis**: Filters and analyzes only the most positive comments
- **Dual Interface**: Supports both chat protocol and REST API
- **Marketing-Ready**: Single paragraph summaries for promotional content

---

## System Architecture

```
                Positive Social Agent System                     
─────────────────────────────────────────────────────────────────
                                                                 
   User Query    ───▶   ASI:One AI    ───▶  Intelligence   
 "Instagram           Reasoning            Engine        
  feedback"            (asi1-extended)                       
                                 │                        │        
                                 ▼                        ▼        
   Tool Usage    ◀───   Decision      ───▶   Direct        
   Decision            Matrix               Response      
           │                                                       
           ▼                                                       
   Social MCP    ───▶   Instagram     ───▶   Comment       
   Server Call          Scraping             Collection    
                                 │                        │        
                                 ▼                        ▼        
   Single        ◀───   Positive      ◀───   Comment       
   Paragraph           Analysis            Filtering     
                                                                 
─────────────────────────────────────────────────────────────────
```

---

## Core Components

### Agent Configuration
```python
agent = Agent(
    name="asi_positive_social_media_search_agent",
    port=8080,  # Same port as negative agent but different endpoint
    seed="asi positive social media search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)
```

### SocialMediaSearchAgent Class

**Primary Engine** for Instagram comment analysis:

```python
class SocialMediaSearchAgent:
    def __init__(self):
        self.social_endpoint = SOCIAL_MCP_ENDPOINT
```

**Key Methods:**
- `search_social_media_comments(brand_name)`: Executes Social Medias search via Social MCP server
- `create_social_media_tool_schema()`: Defines tool schema for ASI:One integration
- `process_social_media_query(user_query)`: Main processing pipeline with AI intelligence

### Data Models

**Request Model:**
```python
class PositiveSocialMediaRequest(Model):
    brand_name: str  # No sentiment parameter - always positive
```

**Response Model:**
```python
class PositiveSocialMediaResponse(Model):
    success: bool
    brand_name: str
    social_media_result: str
    timestamp: str
    agent_address: str
```

---

## Intelligent Query Processing

### ASI:One Integration

The agent uses **ASI:One's asi1-extended model** for intelligent decision making and analysis:

**Decision Criteria:**
1. **Social Media Requests**: Does the query ask for social media comments, Instagram posts, or community feedback?
2. **Brand/Company Focus**: Is the query about specific brands or companies?
3. **Positive Sentiment**: Are they looking for positive social media comments or community feedback?
4. **Community Research**: Do they want Social media sentiment insights?

**Tool Usage Triggers (USE TOOL):**
- "Find positive Social comments for Apple"
- "What do Social Media users discuss about Nike?"
- "Show me Instagram comments about Tesla products"
- "Social Media feedback for Starbucks"
- "What do people love about [brand] on Social Media?"

### Advanced Analysis Process

**Unique Intelligence Features:**
> **CRITICAL REQUIREMENT**: Analyze ALL Instagram comments and extract ONLY the MOST POSITIVE ones, then provide a single paragraph summary of how people view the brand positively.

**Analysis Approach:**
1. **Read All Comments**: Processes entire Instagram comment dataset
2. **Identify Positive Sentiment**: Looks for ❤️, 🔥, 😍, "love", "amazing", "best", "perfect", "awesome"
3. **Extract Enthusiastic Experiences**: Focuses on most positive user experiences
4. **Group Themes**: Quality, innovation, design, user experience, brand loyalty
5. **Single Paragraph**: Marketing-ready positive brand perception narrative

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
- **Single Model**: `asi1-extended` for both decision making and comprehensive analysis
- **Temperature**: 0.3 for controlled, consistent analysis

### Social MCP Server Integration
**Endpoint**: `https://socialsmcp-739298578243.us-central1.run.app/scrape-social-comments`

**Request Format:**
```python
{
    "brand_name": "Apple"
}
```

---

## Usage Examples

### REST API Usage

**Basic Request:**
```bash
curl -X POST http://localhost:8080/social/positive \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Apple"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/social/positive",
    json={"brand_name": "Tesla"}
)

result = response.json()
print(result["social_media_result"])  # Marketing-ready paragraph
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/social/positive', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({brand_name: 'Nike'})
});

const result = await response.json();
console.log(result.social_media_result);
```

### Chat Protocol Usage
```python
from uagents.contrib.protocols.chat import ChatMessage, TextContent

message = ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(
        type="text", 
        text="Find positive Instagram feedback about Starbucks"
    )]
)

await ctx.send(agent_address, message)
```

---

## REST API Endpoint

### POST /social/positive

**Request:**
```json
{
  "brand_name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "brand_name": "Apple",
  "social_media_result": "Instagram users consistently express deep admiration for Apple's innovative design philosophy and premium build quality, with numerous comments praising the seamless integration between devices and the intuitive user experience that makes technology accessible to everyone, while many customers celebrate the company's commitment to privacy and environmental sustainability that resonates with their values, and several users highlight how Apple products have transformed their creative workflows and productivity with features that just work effortlessly, additionally there are recurring expressions of loyalty and excitement for new product launches that demonstrate the strong emotional connection users feel with the brand, with users also appreciating the excellent customer service and the way Apple stores create welcoming spaces for learning and exploration.",
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
   - **ASI:One asi1-extended** analyzes query for Social Media-related intent
   - Decides whether to use Instagram search tool or respond directly
   - Applies Social Media-specific decision criteria

3. **Social Media Search** (if tool is used)
   - Extracts brand name from tool call
   - Sends POST request to cloud Social MCP server
   - Processes Social Media comment data and engagement metrics

4. **Advanced Analysis**
   - **ASI:One asi1-extended** analyzes ALL Instagram comments
   - **Filters for positive sentiment** using emoji and keyword detection
   - **Groups themes** like quality, innovation, design, user experience
   - **Generates single paragraph** for marketing-ready brand perception

### Example Flow
**Input**: "What do Instagram users love about Nike?"
**Process**: Query Analysis → Tool Usage Decision → Cloud MCP Call → Positive Analysis → Marketing Paragraph Generation
**Output**: Single paragraph highlighting Nike's positive brand perception on Instagram

---

## Response Examples

### Marketing-Ready Response Format
```
Instagram users consistently express deep admiration for Tesla's groundbreaking electric vehicle technology and innovative approach to sustainable transportation, with numerous comments celebrating the incredible acceleration and smooth driving experience that makes every journey exciting, while many customers praise the company's over-the-air software updates that continuously improve their vehicles and add new features that feel like getting a new car, and several users highlight how the Supercharger network has made long-distance travel convenient and stress-free, additionally there are recurring expressions of pride in owning a vehicle that represents the future of transportation and environmental responsibility, with users also appreciating the minimalist interior design and the way the large touchscreen interface simplifies the driving experience while providing access to entertainment and productivity features.
```

### Error Response
```json
{
  "success": false,
  "brand_name": "InvalidBrand",
  "social_media_result": "Error processing positive social media for InvalidBrand: Brand account not found on Instagram",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent_address_here"
}
```

---

## Use Cases

### Brand Promotion
- Generate marketing-ready Social Media sentiment summaries
- Understand what customers love about your brand
- Create authentic testimonial content from social media

### Marketing Campaigns
- Extract positive brand perception for promotional materials
- Identify key strengths and selling points from community feedback
- Generate social proof content for marketing campaigns

### Competitive Analysis
- Analyze competitor strengths on Social Media
- Understand positive community sentiment patterns
- Identify market positioning opportunities

### Product Marketing
- Learn what Instagram users love about products
- Identify key features that drive positive sentiment
- Track product reception and enthusiasm in social context

---

## 🔧 Advanced Features

### AI-Powered Analysis
- **Comprehensive Processing**: Analyzes Social Media comments
- **Intelligent Filtering**: Identifies positive sentiment indicators
- **Theme Grouping**: Categorizes positives and strengths
- **Narrative Generation**: Marketing-ready single-paragraph summaries

---

## Conclusion

The Positive Social Agent provides a unique, intelligent approach to Social Media sentiment analysis with its advanced comment filtering and marketing-ready single-paragraph analysis format. Its AI-powered intelligence ensures efficient operation by only performing Social Media searches when truly needed, while its specialized positive sentiment focus makes it perfect for brand promotion, marketing campaigns, and competitive analysis.

**Key Strengths:**
- **Social Media-Specialized**: Exclusively focuses on Social Media brand account comments
- **Positive-Focused**: Filters and analyzes only enthusiastic praise and testimonials
- **AI-Intelligent**: Advanced comment analysis and theme grouping
- **Marketing Format**: Single paragraph summaries perfect for promotional content
- **Cloud-Powered**: Reliable Google Cloud Run backend
- **Comprehensive**: Processes all comments to identify brand strengths and customer love

Perfect for marketing teams, brand managers, competitive analysts, and organizations needing rapid insights into Social media praise and positive brand perception without the complexity of individual comment attribution.
