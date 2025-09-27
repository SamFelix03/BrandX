from datetime import datetime, timezone
import mailbox
from uuid import uuid4
from typing import Any, Dict, List, Optional
import json
import os
from dotenv import load_dotenv
from uagents import Context, Model, Protocol, Agent
from hyperon import MeTTa

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)

# Import components from separate files
from brand.brandrag import BrandRAG
from brand.knowledge import initialize_knowledge_graph
from brand.utils import LLM, process_query

# Load environment variables
load_dotenv()

# Set your API keys
ASI_ONE_API_KEY = os.environ.get("ASI_ONE_API_KEY")
AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")

if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")
if not AGENTVERSE_API_KEY:
    raise ValueError("Please set AGENTVERSE_API_KEY environment variable")

# Initialize agent
agent = Agent(
    name="brand_metrics_agent",
    port=8080,
    seed="brand metrics agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)

# REST API Models
class BrandResearchRequest(Model):
    brand_name: str

class BrandResearchResponse(Model):
    success: bool
    brand_name: str
    research_result: str
    timestamp: str
    agent_address: str

class BrandQueryRequest(Model):
    query: str

class BrandQueryResponse(Model):
    success: bool
    query: str
    answer: str
    timestamp: str
    agent_address: str

class BrandDataRequest(Model):
    brand_name: str
    data_type: Optional[str] = None
    sentiment: Optional[str] = None

class BrandDataResponse(Model):
    success: bool
    brand_name: str
    data_type: str
    sentiment: str
    results: List[str]
    timestamp: str
    agent_address: str

class BrandSummaryRequest(Model):
    brand_name: str

class BrandSummaryResponse(Model):
    success: bool
    brand_name: str
    summary: Dict
    timestamp: str
    agent_address: str

class AllBrandsResponse(Model):
    success: bool
    brands: List[str]
    timestamp: str
    agent_address: str

class LastMetricsResponse(Model):
    success: bool
    brand_name: Optional[str]
    metrics: Optional[Dict]
    timestamp: str
    agent_address: str

# A2A Communication Models for sending metrics to bounty-agent
class MetricsData(Model):
    brand_name: str
    web_results: List[str]
    positive_reviews: List[str]
    negative_reviews: List[str]
    positive_reddit: List[str]
    negative_reddit: List[str]
    positive_social: List[str]
    negative_social: List[str]
    timestamp: str
    source_agent: str

class MetricsResponse(Model):
    success: bool
    message: str
    timestamp: str
    agent_address: str

class BrandMetricsRequest(Model):
    brand_name: str

class BrandMetricsResponse(Model):
    success: bool
    brand_name: str
    metrics: Dict
    timestamp: str
    agent_address: str

async def send_metrics_to_bounty_agent(ctx: Context, brand_name: str, brand_summary: Dict):
    """Send brand metrics data to the bounty agent via A2A communication."""
    try:
        # Extract data from brand summary
        web_results = brand_summary.get('web_results', [])
        positive_reviews = brand_summary.get('positive_reviews', [])
        negative_reviews = brand_summary.get('negative_reviews', [])
        positive_reddit = brand_summary.get('positive_reddit', [])
        negative_reddit = brand_summary.get('negative_reddit', [])
        positive_social = brand_summary.get('positive_social', [])
        negative_social = brand_summary.get('negative_social', [])
        
        # Create metrics data message
        metrics_data = MetricsData(
            brand_name=brand_name,
            web_results=web_results,
            positive_reviews=positive_reviews,
            negative_reviews=negative_reviews,
            positive_reddit=positive_reddit,
            negative_reddit=negative_reddit,
            positive_social=positive_social,
            negative_social=negative_social,
            timestamp=datetime.now(timezone.utc).isoformat(),
            source_agent=ctx.agent.address
        )
        
        # Get bounty agent address from environment variable or use default
        bounty_agent_address = os.environ.get("BOUNTY_AGENT_ADDRESS", "agent1qdapkeqxpq0snse0uvkfsz47zv98ewkzlv624mmmtdrudpnvjpngsjrl0rm")
        
        if bounty_agent_address == "agent1q...":
            ctx.logger.warning("⚠️ Bounty agent address not configured. Set BOUNTY_AGENT_ADDRESS environment variable.")
            return
        
        ctx.logger.info(f"📤 Sending metrics data for {brand_name} to bounty agent...")
        await ctx.send(bounty_agent_address, metrics_data)
        ctx.logger.info(f"✅ Metrics data sent successfully for {brand_name}")
        
    except Exception as e:
        ctx.logger.error(f"❌ Error sending metrics to bounty agent: {e}")

def generate_brand_metrics(brand_name: str, brand_summary: Dict, llm: LLM) -> Dict:
    """Generate comprehensive brand metrics using LLM analysis."""
    
    # Extract all data types
    web_results = brand_summary.get('web_results', [])
    positive_reviews = brand_summary.get('positive_reviews', [])
    negative_reviews = brand_summary.get('negative_reviews', [])
    positive_reddit = brand_summary.get('positive_reddit', [])
    negative_reddit = brand_summary.get('negative_reddit', [])
    positive_social = brand_summary.get('positive_social', [])
    negative_social = brand_summary.get('negative_social', [])
    
    # Create comprehensive data summary for LLM
    all_data = []
    
    if web_results:
        all_data.append(f"WEB SEARCH RESULTS:\n{chr(10).join(web_results[:5])}")
    
    if positive_reviews:
        all_data.append(f"POSITIVE REVIEWS:\n{chr(10).join(positive_reviews[:5])}")
    
    if negative_reviews:
        all_data.append(f"NEGATIVE REVIEWS:\n{chr(10).join(negative_reviews[:5])}")
    
    if positive_reddit:
        all_data.append(f"POSITIVE REDDIT DISCUSSIONS:\n{chr(10).join(positive_reddit[:5])}")
    
    if negative_reddit:
        all_data.append(f"NEGATIVE REDDIT DISCUSSIONS:\n{chr(10).join(negative_reddit[:5])}")
    
    if positive_social:
        all_data.append(f"POSITIVE SOCIAL MEDIA:\n{chr(10).join(positive_social[:5])}")
    
    if negative_social:
        all_data.append(f"NEGATIVE SOCIAL MEDIA:\n{chr(10).join(negative_social[:5])}")
    
    comprehensive_data = "\n\n".join(all_data)
    
    # Create the comprehensive metrics generation prompt
    prompt = f"""
You are a Brand Metrics Analyst AI specializing in comprehensive brand health assessment. 

BRAND: {brand_name}

COMPREHENSIVE BRAND DATA:
{comprehensive_data}

TASK: Analyze the provided brand data and generate comprehensive metrics in the following EXACT JSON format:

{{
  "brand_analysis_metadata": {{
    "brand_name": "{brand_name}",
    "analysis_timestamp": "2024-01-01T00:00:00Z",
    "analysis_model": "asi1-mini"
  }},
  "sentiment_metrics": {{
    "overall_brand_sentiment_score": 0-100,
    "web_media_sentiment_score": 0-100,
    "customer_review_sentiment_score": 0-100,
    "social_media_sentiment_score": 0-100,
    "sentiment_volatility_score": 0-100,
    "positive_mention_ratio": 0-100
  }},
  "reputation_risk_metrics": {{
    "crisis_severity_level": 0-100,
    "active_safety_recalls_count": 0+,
    "reputation_vulnerability_score": 0-100,
    "regulatory_attention_score": 0-100,
    "negative_media_coverage_intensity": 0-100
  }},
  "market_position_metrics": {{
    "competitive_advantage_score": 0-100,
    "competitive_pressure_intensity": 0-100,
    "market_leadership_perception": 0-100,
    "brand_differentiation_score": 0-100,
    "industry_innovation_ranking": 0-100
  }},
  "customer_experience_metrics": {{
    "customer_satisfaction_proxy": 0-100,
    "review_volume_strength": 0-100,
    "customer_advocacy_level": 0-100,
    "complaint_resolution_effectiveness": 0-100,
    "service_quality_perception": 0-100
  }},
  "performance_indicators": {{
    "brand_health_index": 0-100,
    "brand_resilience_score": 0-100,
    "growth_potential_indicator": 0-100,
    "stakeholder_confidence_level": 0-100,
    "future_readiness_score": 0-100
  }},
  "strategic_insights": {{
    "primary_improvement_area": "Crisis Management|Innovation|Customer Experience|Marketing",
    "urgency_level": "LOW|MEDIUM|HIGH|CRITICAL",
    "investment_priority_score": 0-100,
    "competitive_threat_level": 0-100,
    "brand_momentum_direction": "DECLINING|STABLE|GROWING|ACCELERATING"
  }}
}}

SCORING GUIDELINES:
- 0-25: Poor/Critical
- 26-50: Below Average/Needs Improvement  
- 51-75: Good/Acceptable
- 76-100: Excellent/Outstanding

ANALYSIS REQUIREMENTS:
1. Base all scores on actual data provided
2. Consider sentiment patterns across all platforms
3. Assess competitive positioning from web results
4. Evaluate customer experience from reviews
5. Identify reputation risks from negative mentions
6. Determine market position from overall sentiment
7. Provide strategic insights based on data patterns

CRITICAL: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanations, no additional text. Just the raw JSON object.
"""
    
    try:
        response = llm.create_completion(prompt)
        print(f"Raw LLM response: {response[:200]}...")
        
        # Clean the response - remove any markdown formatting
        cleaned_response = response.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        print(f"Cleaned response: {cleaned_response[:200]}...")
        
        # Parse the JSON response
        import json
        metrics = json.loads(cleaned_response)
        return metrics
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response that failed to parse: {response}")
        # Return default metrics structure if parsing fails
        return {
            "brand_analysis_metadata": {
                "brand_name": brand_name,
                "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                "analysis_model": "asi1-mini"
            },
            "error": f"Failed to parse JSON response: {str(e)}",
            "raw_response": response[:500]  # Include first 500 chars for debugging
        }
    except Exception as e:
        print(f"Error generating metrics: {e}")
        # Return default metrics structure if parsing fails
        return {
            "brand_analysis_metadata": {
                "brand_name": brand_name,
                "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                "analysis_model": "asi1-mini"
            },
            "error": f"Failed to generate metrics: {str(e)}"
        }

# Initialize global components
metta = MeTTa()
initialize_knowledge_graph(metta)
rag = BrandRAG(metta)
llm = LLM(api_key=ASI_ONE_API_KEY)

# Global storage for last metrics data
last_metrics_data = None
last_brand_name = None

# Protocol setup
chat_proto = Protocol(spec=chat_protocol_spec)

def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    """Create a text chat message."""
    content = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=content,
    )

# Startup Handler
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"Brand Metrics Agent started with address: {ctx.agent.address}")
    ctx.logger.info("Agent is ready to process brand metrics analysis using MeTTa Knowledge Graph!")
    ctx.logger.info("REST API endpoints available:")
    ctx.logger.info("- POST http://localhost:8080/brand/research")
    ctx.logger.info("- POST http://localhost:8080/brand/query")
    ctx.logger.info("- POST http://localhost:8080/brand/data")
    ctx.logger.info("- POST http://localhost:8080/brand/summary")
    ctx.logger.info("- POST http://localhost:8080/brand/metrics")
    ctx.logger.info("- GET  http://localhost:8080/brands/all")
    ctx.logger.info("- GET  http://localhost:8080/brand/metrics/last")

# Chat Protocol Handlers
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages and process brand research queries."""
    ctx.storage.set(str(ctx.session), sender)
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id),
    )

    for item in msg.content:
        if isinstance(item, StartSessionContent):
            ctx.logger.info(f"Got a start session message from {sender}")
            continue
        elif isinstance(item, TextContent):
            user_query = item.text.strip()
            ctx.logger.info(f"Got a brand research query from {sender}: {user_query}")
            
            try:
                # Process the query using the brand research assistant logic
                response = process_query(user_query, rag, llm)
                
                # Format the response
                if isinstance(response, dict):
                    answer_text = f"**{response.get('selected_question', user_query)}**\n\n{response.get('humanized_answer', 'I apologize, but I could not process your query.')}"
                else:
                    answer_text = str(response)
                
                # Send the response back
                await ctx.send(sender, create_text_chat(answer_text))
                
            except Exception as e:
                ctx.logger.error(f"Error processing brand research query: {e}")
                await ctx.send(
                    sender, 
                    create_text_chat("I apologize, but I encountered an error processing your brand research query. Please try again.")
                )
        else:
            ctx.logger.info(f"Got unexpected content from {sender}")

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle chat acknowledgements."""
    ctx.logger.info(f"Got an acknowledgement from {sender} for {msg.acknowledged_msg_id}")

# Message Handler for receiving acknowledgments from bounty-agent
@agent.on_message(MetricsResponse)
async def handle_metrics_response(ctx: Context, sender: str, msg: MetricsResponse):
    """Handle acknowledgment from bounty agent after sending metrics."""
    ctx.logger.info(f"📥 Received acknowledgment from bounty agent: {msg.message}")
    ctx.logger.info(f"✅ Metrics data successfully received by bounty agent at {msg.timestamp}")

# REST API Handlers
@agent.on_rest_post("/brand/research", BrandResearchRequest, BrandResearchResponse)
async def handle_brand_research(ctx: Context, req: BrandResearchRequest) -> BrandResearchResponse:
    """Handle comprehensive brand research requests."""
    ctx.logger.info(f"Received brand research request for: {req.brand_name}")
    
    try:
        # Get comprehensive brand data from knowledge graph
        brand_summary = rag.get_brand_summary(req.brand_name)
        
        if brand_summary:
            # Format the research result
            research_result = f"**Comprehensive Brand Research for {req.brand_name}**\n\n"
            
            if brand_summary.get('web_results'):
                research_result += f"**Web Results:**\n{brand_summary['web_results']}\n\n"
            
            if brand_summary.get('positive_reviews'):
                research_result += f"**Positive Reviews:**\n{brand_summary['positive_reviews']}\n\n"
            
            if brand_summary.get('negative_reviews'):
                research_result += f"**Negative Reviews:**\n{brand_summary['negative_reviews']}\n\n"
            
            if brand_summary.get('positive_reddit'):
                research_result += f"**Positive Reddit Discussions:**\n{brand_summary['positive_reddit']}\n\n"
            
            if brand_summary.get('negative_reddit'):
                research_result += f"**Negative Reddit Discussions:**\n{brand_summary['negative_reddit']}\n\n"
            
            if brand_summary.get('positive_social'):
                research_result += f"**Positive Social Media:**\n{brand_summary['positive_social']}\n\n"
            
            if brand_summary.get('negative_social'):
                research_result += f"**Negative Social Media:**\n{brand_summary['negative_social']}\n\n"
            
            return BrandResearchResponse(
                success=True,
                brand_name=req.brand_name,
                research_result=research_result,
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        else:
            return BrandResearchResponse(
                success=False,
                brand_name=req.brand_name,
                research_result=f"No data found for brand: {req.brand_name}",
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        
    except Exception as e:
        error_msg = f"Error processing brand research for {req.brand_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandResearchResponse(
            success=False,
            brand_name=req.brand_name,
            research_result=error_msg,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_post("/brand/query", BrandQueryRequest, BrandQueryResponse)
async def handle_brand_query(ctx: Context, req: BrandQueryRequest) -> BrandQueryResponse:
    """Handle general brand research queries."""
    ctx.logger.info(f"Received brand query: {req.query}")
    
    try:
        # Process the query using the brand research assistant logic
        response = process_query(req.query, rag, llm)
        
        # Format the response
        if isinstance(response, dict):
            answer_text = f"**{response.get('selected_question', req.query)}**\n\n{response.get('humanized_answer', 'I apologize, but I could not process your query.')}"
        else:
            answer_text = str(response)
        
        return BrandQueryResponse(
            success=True,
            query=req.query,
            answer=answer_text,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing query '{req.query}': {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandQueryResponse(
            success=False,
            query=req.query,
            answer=error_msg,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_post("/brand/data", BrandDataRequest, BrandDataResponse)
async def handle_brand_data(ctx: Context, req: BrandDataRequest) -> BrandDataResponse:
    """Handle specific brand data queries."""
    ctx.logger.info(f"Received brand data request for: {req.brand_name}, type: {req.data_type}, sentiment: {req.sentiment}")
    
    try:
        # Query specific brand data
        results = rag.query_brand_data(req.brand_name, req.data_type, req.sentiment)
        
        return BrandDataResponse(
            success=True,
            brand_name=req.brand_name,
            data_type=req.data_type or "all",
            sentiment=req.sentiment or "all",
            results=results,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing brand data request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandDataResponse(
            success=False,
            brand_name=req.brand_name,
            data_type=req.data_type or "all",
            sentiment=req.sentiment or "all",
            results=[],
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_post("/brand/summary", BrandSummaryRequest, BrandSummaryResponse)
async def handle_brand_summary(ctx: Context, req: BrandSummaryRequest) -> BrandSummaryResponse:
    """Handle brand summary requests."""
    ctx.logger.info(f"Received brand summary request for: {req.brand_name}")
    
    try:
        # Get comprehensive brand summary
        summary = rag.get_brand_summary(req.brand_name)
        
        return BrandSummaryResponse(
            success=True,
            brand_name=req.brand_name,
            summary=summary,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing brand summary request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandSummaryResponse(
            success=False,
            brand_name=req.brand_name,
            summary={},
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_get("/brands/all", AllBrandsResponse)
async def handle_all_brands(ctx: Context) -> AllBrandsResponse:
    """Handle requests for all available brands."""
    ctx.logger.info("Received request for all brands")
    
    try:
        # Get all brands
        brands = rag.get_all_brands()
        
        return AllBrandsResponse(
            success=True,
            brands=brands,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing all brands request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return AllBrandsResponse(
            success=False,
            brands=[],
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_get("/brand/metrics/last", LastMetricsResponse)
async def handle_last_metrics(ctx: Context) -> LastMetricsResponse:
    """Handle requests for the last generated brand metrics."""
    ctx.logger.info("Received request for last brand metrics")
    
    try:
        global last_metrics_data, last_brand_name
        
        if last_metrics_data is not None and last_brand_name is not None:
            return LastMetricsResponse(
                success=True,
                brand_name=last_brand_name,
                metrics=last_metrics_data,
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        else:
            return LastMetricsResponse(
                success=False,
                brand_name=None,
                metrics=None,
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        
    except Exception as e:
        error_msg = f"Error processing last metrics request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return LastMetricsResponse(
            success=False,
            brand_name=None,
            metrics=None,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_post("/brand/metrics", BrandMetricsRequest, BrandMetricsResponse)
async def handle_brand_metrics(ctx: Context, req: BrandMetricsRequest) -> BrandMetricsResponse:
    """Handle comprehensive brand metrics analysis requests."""
    ctx.logger.info(f"Received brand metrics request for: {req.brand_name}")
    
    try:
        # Get comprehensive brand data from knowledge graph
        brand_summary = rag.get_brand_summary(req.brand_name)
        
        if brand_summary:
            # Generate comprehensive metrics using LLM
            metrics = generate_brand_metrics(req.brand_name, brand_summary, llm)
            
            # Store the metrics data globally for the last metrics endpoint
            global last_metrics_data, last_brand_name
            last_metrics_data = metrics
            last_brand_name = req.brand_name
            
            # Send metrics data to bounty agent via A2A communication
            await send_metrics_to_bounty_agent(ctx, req.brand_name, brand_summary)
            
            return BrandMetricsResponse(
                success=True,
                brand_name=req.brand_name,
                metrics=metrics,
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        else:
            return BrandMetricsResponse(
                success=False,
                brand_name=req.brand_name,
                metrics={},
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_address=ctx.agent.address
            )
        
    except Exception as e:
        error_msg = f"Error processing brand metrics for {req.brand_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandMetricsResponse(
            success=False,
            brand_name=req.brand_name,
            metrics={},
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting Brand Metrics Agent...")
    print(f"✅ Agent address: {agent.address}")
    print("📡 Ready to process brand metrics analysis using MeTTa Knowledge Graph")
    print("🧠 Powered by ASI:One AI reasoning and MeTTa Knowledge Graph")
    print("\n🌐 REST API Endpoints:")
    print("POST http://localhost:8080/brand/research")
    print("Body: {\"brand_name\": \"Tesla\"}")
    print("\nPOST http://localhost:8080/brand/query")
    print("Body: {\"query\": \"Tell me about Apple's sentiment analysis\"}")
    print("\nPOST http://localhost:8080/brand/data")
    print("Body: {\"brand_name\": \"Nike\", \"data_type\": \"reviews\", \"sentiment\": \"negative\"}")
    print("\nPOST http://localhost:8080/brand/summary")
    print("Body: {\"brand_name\": \"Samsung\"}")
    print("\nPOST http://localhost:8080/brand/metrics")
    print("Body: {\"brand_name\": \"Tesla\"}")
    print("Returns: Comprehensive brand metrics including sentiment, reputation risk, market position, customer experience, performance indicators, and strategic insights")
    print("\nGET http://localhost:8080/brands/all")
    print("\nGET http://localhost:8080/brand/metrics/last")
    print("Returns: The metrics data for the last brand that generated metrics")
    print("\n🧪 Test queries:")
    print("- 'What brands do you have data for?'")
    print("- 'Tell me about Tesla's sentiment analysis'")
    print("- 'How do Apple's reviews compare to Samsung?'")
    print("- 'What are the negative reviews for Nike?'")
    print("- 'Generate comprehensive metrics for Tesla'")
    print("\n📊 Brand Metrics Analysis includes:")
    print("- Sentiment Metrics (overall, web, reviews, social)")
    print("- Reputation Risk Metrics (crisis severity, vulnerability)")
    print("- Market Position Metrics (competitive advantage, leadership)")
    print("- Customer Experience Metrics (satisfaction, advocacy)")
    print("- Performance Indicators (health index, resilience)")
    print("- Strategic Insights (improvement areas, urgency levels)")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Brand Metrics Agent...")
        print("✅ Agent stopped.")