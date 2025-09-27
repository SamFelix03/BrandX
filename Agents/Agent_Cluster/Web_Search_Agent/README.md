# WebSearch Agent

## Overview

The **WebSearch Agent** combines the power of **ASI:One AI** and **Exa Research tool** to provide comprehensive, real-time information about brands, companies, products, and topics. The agent intelligently decides when to perform web research versus answering queries directly using general knowledge.

### Key Features
- **Intelligent Decision Making**: Automatically determines when web research is needed
- **Comprehensive Research**: Uses Exa API for deep, multi-source research
- **AI-Powered Analysis**: Leverages ASI:One for intelligent reasoning and response generation
- **REST API**: Provides HTTP endpoints for external integration
- **Real-time Communication**: Supports both chat protocols and REST API
- **Asynchronous Processing**: Handles long-running research tasks efficiently

---

## Architecture

```
   User Query    ───▶   ASI:One AI    ───▶   Decision      
                      Reasoning              Engine        
                                                       │
                                                       ▼
   Final         ◀───   Response      ◀───   Exa Research  
   Response           Generation            API           
```

### System Components
1. **ASI:One AI Engine**: Handles intelligent reasoning and decision making
2. **Exa Research**: Performs comprehensive web research
3. **uAgents Framework**: Manages agent lifecycle and communication
4. **REST API Server**: Provides HTTP endpoints for external access
5. **Chat Protocol**: Enables real-time messaging capabilities

---

## Core Components

### 1. WebSearchAgent Class

The main agent class that orchestrates the entire research process.

```python
class WebSearchAgent:
    def __init__(self):
        self.exa_api_key = EXA_API_KEY
```

**Key Methods:**
- `exa_search(query)`: Initiates comprehensive research using Exa API
- `poll_research_completion(research_id)`: Monitors research progress
- `create_search_tool_schema()`: Defines the tool schema for ASI:One
- `process_search_query(user_query)`: Main processing pipeline

### 2. ASI:One Integration

**Purpose**: Provides intelligent reasoning to determine when web research is needed.

**Decision Criteria**:
- **USE RESEARCH** when:
  - Querying specific brands, companies, or products
  - Asking for recent news or developments
  - Requesting comprehensive analysis
  - Seeking information about controversies or market trends
  - Asking "what's happening with" or "latest news about"

### 3. Exa Research API

**Purpose**: Performs comprehensive web research across multiple sources.

**Research Areas Covered**:
1. **Recent News & Developments**
2. **Brand Perception & Reputation**
3. **Controversies & Challenges**
4. **Market Trends & Analysis**
5. **Products & Services**

**Sources Analyzed**:
- News websites and financial publications
- Industry blogs and expert analysis
- Social media platforms and forums
- Company websites and press releases
- Review sites and customer feedback platforms
- Research reports and market analysis

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

**Models Used**:
- `asi1-extended`: For intelligent reasoning and response generation

### Exa Research API Configuration

```python
# Research initiation
POST https://api.exa.ai/research/v1
{
    "model": "exa-research",
    "instructions": "comprehensive research instructions"
}

# Research status polling
GET https://api.exa.ai/research/v1/{research_id}
```

**Research States**:
- `running`: Research in progress
- `completed`: Research finished successfully
- `failed`: Research encountered an error

---

## Workflow Process

### 1. Query Reception
```
User Query → ASI:One AI → Decision Analysis
```

### 2. Decision Making
ASI:One analyzes the query and determines if web research is needed based on:
- Information recency requirements
- Specific entity mentions
- Research depth requests
- Time-sensitive indicators

### 3. Research Execution (if needed)
```
ASI:One → Exa API → Research Initiation → Polling → Results
```

### 4. Response Generation
```
Research Results → ASI:One → Final Response → User
```

### Detailed Workflow

1. **Query Analysis**
   - User sends query via chat or REST API
   - ASI:One receives query with system prompt
   - AI analyzes query characteristics

2. **Tool Decision**
   - ASI:One evaluates if `exa_search` tool should be used
   - Decision based on intelligent reasoning criteria
   - Tool choice set to "auto" for autonomous decision

3. **Research Execution** (if tool is called)
   - Exa API receives comprehensive research instructions
   - Research ID returned for tracking
   - Agent polls for completion status
   - Results retrieved when research completes

4. **Response Synthesis**
   - Research results fed back to ASI:One
   - AI generates comprehensive response
   - Response includes citations and sources
   - Final response sent to user

---

### Agent Configuration

```python
agent = Agent(
    name="asi_exa_search_agent",
    port=8081,
    seed="asi exa search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8081/submit"]
)
```

**Configuration Options**:
- `name`: Agent identifier
- `port`: HTTP server port
- `seed`: Cryptographic seed for agent identity
- `mailbox`: Enable message handling
- `endpoint`: Agent communication endpoint

---

## Usage Examples

### 1. Chat Protocol Usage

```python
# Send message to agent
message = ChatMessage(
    timestamp=datetime.utcnow(),
    msg_id=uuid4(),
    content=[TextContent(type="text", text="Research Tesla brand")]
)

await ctx.send(agent_address, message)
```

### 2. REST API Usage

```bash
# Brand research request
curl -X POST http://localhost:8081/research/brand \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Tesla"}'
```

### 3. Python Client Usage

```python
import requests

response = requests.post(
    "http://localhost:8081/research/brand",
    json={"brand_name": "Apple"},
    headers={"Content-Type": "application/json"},
    timeout=300
)

result = response.json()
print(result["research_result"])
```

---

## REST API Endpoints

### POST /research/brand

**Purpose**: Perform comprehensive brand research

**Request Body**:
```json
{
    "brand_name": "string"
}
```

**Response**:
```json
{
    "success": true,
    "brand_name": "Tesla",
    "research_result": "Comprehensive research results...",
    "timestamp": "2024-01-15T10:30:00Z",
    "agent_address": "agent_address_here"
}
```

**Status Codes**:
- `200`: Success
- `400`: Bad Request
- `500`: Internal Server Error

**Example Usage**:
```bash
curl -X POST http://localhost:8081/research/brand \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Tesla"}'
```

---

## Testing

### Running Tests

```bash
python test_rest_endpoint.py
```

### Test Coverage

The test suite covers:
1. **Valid Brand Research Requests**
   - Tests multiple brands (Tesla, Apple, OpenAI, Microsoft)
   - Validates response structure
   - Checks success indicators

2. **Invalid Request Handling**
   - Missing required fields
   - Malformed JSON
   - Invalid data types

3. **Error Scenarios**
   - Connection errors
   - Timeout handling
   - API failures

### Test Output Example

```
🧪 Testing Brand Research REST Endpoint
==================================================

🔍 Testing brand research for: Tesla
📤 Sending request to: http://localhost:8081/research/brand
📋 Request body: {
  "brand_name": "Tesla"
}
📥 Response status: 200
✅ Success: True
🏷️  Brand: Tesla
⏰ Timestamp: 2024-01-15T10:30:00Z
🤖 Agent Address: agent_address_here
📄 Research Result Length: 2500 characters
📝 Result Preview: Tesla Inc. is an American electric vehicle and clean energy company...
```

---

## Technical Details

### Research Process Deep Dive

1. **Query Analysis Phase**
   - ASI:One receives user query
   - System prompt guides decision making
   - AI evaluates query characteristics
   - Tool usage decision made

2. **Research Initiation Phase**
   - Exa API receives comprehensive instructions
   - Research ID generated for tracking
   - Asynchronous research begins
   - Multiple sources analyzed

3. **Polling Phase**
   - Agent polls Exa API every 5 seconds
   - Status checked: running/completed/failed
   - Maximum 100 attempts (8+ minutes)
   - Results retrieved when complete

4. **Response Generation Phase**
   - Research results fed to ASI:One
   - AI synthesizes comprehensive response
   - Citations and sources included
   - Final response formatted

---

## Advanced Usage

### Custom Research Instructions

Modify the research instructions in `exa_search()` method:

```python
custom_instructions = f"""
Custom research instructions for: {query}
- Focus on specific aspects
- Include particular sources
- Emphasize certain metrics
"""
```

### Integration with Other Agents

```python
# Send research request to websearch agent
research_response = await websearch_agent.research_brand("Tesla")
# Process results in your agent
analysis = analyze_research_results(research_response)
```

### Monitoring and Metrics

Track agent performance:
- Research completion rates
- Response times
- Error frequencies
- API usage patterns

---

## Conclusion

The WebSearch Agent represents a sophisticated approach to intelligent information retrieval, combining the reasoning capabilities of ASI:One with the comprehensive research power of Exa. Its intelligent decision-making ensures that web research is only performed when necessary, optimizing both performance and cost while delivering high-quality, up-to-date information.

The agent's dual-mode operation (chat and REST API) makes it suitable for various integration scenarios, from interactive applications to automated research pipelines. Its robust error handling and comprehensive testing ensure reliable operation in production environments.
