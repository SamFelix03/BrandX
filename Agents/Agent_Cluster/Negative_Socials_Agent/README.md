# Negative Social Agent

## Overview

The **Negative Social Agent** is an AI-powered specialized agent that intelligently searches for and analyzes negative Social Media comments and community complaints about any brand or company. Built on the uAgents framework and powered by ASI:One AI, it provides authentic Social Media criticism with intelligent analysis and single-paragraph summaries.

### Key Features
- **AI-Powered Intelligence**: Uses ASI:One to decide when Social Media research is needed
- **Instagram-Focused**: Exclusively analyzes Instagram comments from brand official accounts
- **Negative Sentiment**: Specialized for complaints, criticism, and negative feedback
- **Intelligent Analysis**: Filters and analyzes only the most negative comments
- **Cloud Integration**: Uses the Social MCP service
- **Dual Interface**: Supports both chat protocol and REST API

---

## System Architecture

```
                Negative Social Agent System                     
─────────────────────────────────────────────────────────────────
                                                                 
   User Query    ───▶   ASI:One AI    ───▶  Intelligence   
 "Instagram           Reasoning            Engine        
  complaints"         (asi1-extended)                       
                                 │                        │        
                                 ▼                        ▼        
   Tool Usage    ◀───   Decision      ───▶   Direct        
   Decision            Matrix               Response      
           │                                                       
           ▼                                                       
   Social MCP    ───▶   Socials      ───▶   Comment       
   Server Call          Scraping             Collection    
                                 │                        │        
                                 ▼                        ▼        
   Single        ◀───   Negative      ◀───   Comment       
   Paragraph           Analysis            Filtering     
                                                                 
─────────────────────────────────────────────────────────────────
```

---

## Core Components

### Agent Configuration
```python
agent = Agent(
    name="asi_negative_social_media_search_agent",
    port=8080,  # Unique port for social media operations
    seed="asi negative social media search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)
```

### NegativeSocialMediaSearchAgent Class

**Primary Engine** for Instagram comment analysis:

```python
class NegativeSocialMediaSearchAgent:
    def __init__(self):
        self.social_endpoint = SOCIAL_MCP_ENDPOINT
```

**Key Methods:**
- `search_social_media_comments(brand_name)`: Executes Instagram search via Social MCP server
- `create_social_media_tool_schema()`: Defines tool schema for ASI:One integration
- `process_social_media_query(user_query)`: Main processing pipeline with AI intelligence

**Unique Features:**
- **Cloud Endpoint**: Uses our Socials MCP service
- **Negative Analysis**: Filters and analyzes only the most critical comments
- **Single Paragraph Output**: Cohesive narrative of brand issues and problems

### Data Models

**Request Model:**
```python
class NegativeSocialMediaRequest(Model):
    brand_name: str  # No sentiment parameter - always negative
```

**Response Model:**
```python
class NegativeSocialMediaResponse(Model):
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
3. **Negative Sentiment**: Are they looking for negative social media comments or community complaints?
4. **Community Research**: Do they want Instagram community sentiment insights?

**Tool Usage Triggers (USE TOOL):**
- "Find negative Instagram comments for Apple"
- "What do Instagram users complain about Nike?"
- "Show me Instagram comments about Tesla problems"
- "Instagram complaints for Starbucks"
- "What issues do people have with [brand] on Instagram?"

### Advanced Analysis Process

**Unique Intelligence Features:**
> **CRITICAL REQUIREMENT**: Analyze ALL Instagram comments and extract ONLY the MOST NEGATIVE ones, then provide a single paragraph summary of the issues and problems people have with the brand.

**Analysis Approach:**
1. **Read All Comments**: Processes entire Instagram comment dataset
2. **Identify Negative Sentiment**: Looks for complaints, "terrible", "awful", "hate", "worst", "broken", "defective", "overpriced"
3. **Extract Critical Issues**: Focuses on most severe user experiences
4. **Group Themes**: Quality issues, customer service, pricing, technical problems
5. **Single Paragraph**: Cohesive narrative of brand problems

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
**Endpoint**: `https://socialsmcp-739298578243.us-central1.run.app/scrape-social-commentss`

**Key Features:**
- **Socials-Focused**: Exclusively scrapes Social Media
- **Comment Collection**: Gathers comprehensive engagement data

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
curl -X POST http://localhost:8080/social/negative \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Apple"}'
```

**Python Client:**
```python
import requests

response = requests.post(
    "http://localhost:8080/social/negative",
    json={"brand_name": "Tesla"}
)

result = response.json()
print(result["social_media_result"])  # Single paragraph analysis
```

**JavaScript Client:**
```javascript
const response = await fetch('http://localhost:8080/social/negative', {
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
        text="Find negative Instagram comments about Starbucks"
    )]
)

await ctx.send(agent_address, message)
```

---

## REST API Endpoint

### POST /social/negative

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
  "social_media_result": "Instagram users frequently express frustration with Apple's pricing policies and product reliability issues, with numerous comments highlighting overpriced accessories and charging cables that break easily, while many customers complain about the company's planned obsolescence practices that force frequent device upgrades, and several users report poor customer service experiences at Apple stores where staff are unhelpful and repair costs are excessive, additionally there are recurring complaints about software updates that slow down older devices and battery life degradation that occurs much sooner than expected, with users also criticizing the lack of innovation in recent product releases and the removal of popular features like the headphone jack.",
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
   - Decides whether to use Socials search tool or respond directly
   - Applies Socials-specific decision criteria

3. **Socials Search** (if tool is used)
   - Extracts brand name from tool call
   - Sends POST request to cloud Social MCP server
   - Processes Social Media comment data and engagement metrics

4. **Advanced Analysis**
   - **ASI:One asi1-extended** analyzes Social Media comments
   - **Filters for negative sentiment** using keyword detection
   - **Groups themes** like quality issues, customer service, pricing
   - **Generates single paragraph** summarizing main brand problems

### Example Flow
**Input**: "What do Instagram users complain about regarding Nike?"
**Process**: Query Analysis → Tool Usage Decision → Cloud MCP Call → Negative Analysis → Paragraph Generation
**Output**: Single paragraph summarizing Nike's main customer issues on Instagram

---

## Response Examples

### Successful Response Format
```
Instagram users frequently express frustration with Tesla's build quality issues and customer service problems, with numerous comments highlighting panel gaps, paint defects, and interior rattles that appear immediately after delivery, while many customers complain about the company's service centers being understaffed and appointments taking weeks to schedule, and several users report software glitches that cause the touchscreen to freeze and require hard resets during driving, additionally there are recurring complaints about the vehicle's range being significantly lower than advertised especially in cold weather conditions, with users also criticizing the lack of physical controls and the difficulty of performing basic functions through the touchscreen interface, and many owners express disappointment with the build quality compared to traditional luxury car manufacturers at similar price points.
```

### Error Response
```json
{
  "success": false,
  "brand_name": "InvalidBrand",
  "social_media_result": "Error processing negative social media for InvalidBrand: Brand account not found on Instagram",
  "timestamp": "2024-03-21T10:30:00Z",
  "agent_address": "agent_address_here"
}
```

---

## Use Cases

### Crisis Management
- Rapid assessment of Social Media community complaints
- Understanding scale and nature of brand issues
- Early detection of emerging problems

### Brand Monitoring
- Track negative Social Media sentiment for brands
- Monitor community complaints and criticism
- Identify recurring customer pain points

### Competitive Analysis
- Analyze competitor criticism on Social Media
- Understand community dissatisfaction patterns
- Identify market opportunities from competitor issues

### Product Development
- Learn from Social Media user complaints
- Identify feature requests and improvements
- Track product reception and issues in social context

---

## Conclusion

The Negative Social Agent provides a unique, intelligent approach to Social Media sentiment analysis with its advanced comment filtering and single-paragraph analysis format. Its AI-powered intelligence ensures efficient operation by only performing Instagram searches when truly needed, while its specialized negative sentiment focus makes it perfect for crisis management, brand monitoring, and issue identification.

**Key Strengths:**
- **Social Media-Specialized**: Exclusively focuses on Social Media brand account comments
- **Negative-Focused**: Filters and analyzes only critical complaints and issues
- **AI-Intelligent**: Advanced comment analysis and theme grouping
- **Analysis Format**: Single paragraph problem summaries for executives
- **Comprehensive**: Processes all comments to identify main brand issues

Perfect for crisis management teams, brand monitoring, competitive analysis, and organizations needing rapid insights into Instagram community complaints and brand issues without the complexity of individual comment attribution.
