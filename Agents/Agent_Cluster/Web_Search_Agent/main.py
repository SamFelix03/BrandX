import os
import time
import json
import requests
from datetime import datetime
from uuid import uuid4
from dotenv import load_dotenv

from uagents import Agent, Protocol, Context, Model
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

# Load environment variables
load_dotenv()

# Set your API keys
ASI_ONE_API_KEY = os.environ.get("ASI_ONE_API_KEY")
EXA_API_KEY = os.environ.get("EXA_API_KEY")
AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")

if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")
if not EXA_API_KEY:
    raise ValueError("Please set EXA_API_KEY environment variable")
if not AGENTVERSE_API_KEY:
    raise ValueError("Please set AGENTVERSE_API_KEY environment variable")

# REST API Models
class BrandResearchRequest(Model):
    brand_name: str

class BrandResearchResponse(Model):
    success: bool
    brand_name: str
    research_result: str
    timestamp: str
    agent_address: str

# ASI:One API configuration
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}

class WebSearchAgent:
    def __init__(self):
        self.exa_api_key = EXA_API_KEY
        
    def exa_search(self, query: str) -> dict:
        """Perform comprehensive web research using Exa API"""
        try:
            print(f"🔍 Starting Exa research for query: '{query}'")
            
            # Enhanced instructions for comprehensive brand research
            brand_research_instructions = f"""
            Research and analyze the brand/topic: {query}
            
            Please provide comprehensive information including:
            
            1. RECENT NEWS & DEVELOPMENTS:
            - Latest news articles and press releases
            - Recent product launches or announcements
            - Corporate developments and business moves
            - Financial news and earnings reports
            
            2. BRAND PERCEPTION & REPUTATION:
            - Current public sentiment and brand perception
            - Customer reviews and feedback analysis
            - Social media mentions and trends
            - Industry analyst opinions
            
            3. CONTROVERSIES & CHALLENGES:
            - Any recent controversies or negative publicity
            - Legal issues or regulatory challenges
            - Competitive threats or market challenges
            - Crisis management situations
            
            4. MARKET TRENDS & ANALYSIS:
            - Industry trends affecting the brand
            - Market position and competitive landscape
            - Growth opportunities and challenges
            - Consumer behavior shifts
            
            5. PRODUCTS & SERVICES:
            - Current product portfolio
            - New product launches or updates
            - Service offerings and innovations
            - Technology developments
            
            Please gather information from diverse sources including:
            - News websites and financial publications
            - Industry blogs and expert analysis
            - Social media platforms and forums
            - Company websites and press releases
            - Review sites and customer feedback platforms
            - Research reports and market analysis
            
            Provide detailed analysis with proper citations and sources for all information.
            Focus on the most recent information (within the last 6-12 months) but include relevant historical context where necessary.
            """
            
            print("📤 Sending research request to Exa API...")
            response = requests.post(
                "https://api.exa.ai/research/v1",
                json={
                    "model": "exa-research",
                    "instructions": brand_research_instructions
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.exa_api_key}"
                }
            )
            
            print(f"📥 Exa API response status: {response.status_code}")
            print(f"📥 Exa API response: {response.text}")
            
            if response.status_code == 201:
                research_data = response.json()
                research_id = research_data.get("researchId")
                
                print(f"🆔 Research ID received: {research_id}")
                
                if research_id:
                    # Poll for completion
                    print("⏳ Starting polling for research completion...")
                    return self.poll_research_completion(research_id)
                else:
                    print("❌ No research ID in response")
                    return {"error": "No research ID returned from Exa API"}
            else:
                print(f"❌ Exa API error: {response.status_code} - {response.text}")
                return {"error": f"Exa API error: {response.status_code} - {response.text}"}
                
        except Exception as e:
            print(f"❌ Search failed with exception: {str(e)}")
            return {"error": f"Search failed: {str(e)}"}
    
    def poll_research_completion(self, research_id: str, max_attempts: int = 100, delay: int = 5) -> dict:
        """Poll Exa API for research completion"""
        try:
            print(f"🔄 Polling research completion for ID: {research_id}")
            
            for attempt in range(max_attempts):
                print(f"📡 Polling attempt {attempt + 1}/{max_attempts}")
                
                response = requests.get(
                    f"https://api.exa.ai/research/v1/{research_id}",
                    headers={
                        "Authorization": f"Bearer {self.exa_api_key}"
                    }
                )
                
                print(f"📥 Poll response status: {response.status_code}")
                print(f"📥 Poll response: {response.text}")
                
                if response.status_code == 200:
                    result = response.json()
                    status = result.get("status")
                    
                    print(f"📊 Research status: {status}")
                    
                    if status == "completed":
                        print("✅ Research completed successfully!")
                        
                        result_data = result.get("result", {})
                        sources_data = result.get("sources", [])
                        
                        print(f"📄 Result data keys: {list(result_data.keys()) if result_data else 'No result data'}")
                        print(f"📚 Sources count: {len(sources_data)}")
                        
                        # Check if we actually got meaningful data
                        if not result_data and not sources_data:
                            print("⚠️ Warning: Research completed but no data or sources returned")
                            return {
                                "success": False,
                                "error": "Research completed but returned no data or sources",
                                "research_id": research_id,
                                "full_response": result
                            }
                        
                        return {
                            "success": True,
                            "data": result_data,
                            "sources": sources_data,
                            "research_id": research_id,
                            "full_response": result  # Include full response for debugging
                        }
                    elif status == "failed":
                        print(f"❌ Research failed: {result.get('error', 'Unknown error')}")
                        return {"error": f"Research failed: {result.get('error', 'Unknown error')}"}
                    elif status == "running":
                        print(f"⏳ Research in progress... (attempt {attempt + 1}/{max_attempts})")
                        time.sleep(delay)
                        continue
                    else:
                        print(f"⚠️ Unknown status: {status}")
                        print(f"📄 Full response: {result}")
                        time.sleep(delay)
                        continue
                else:
                    print(f"❌ Failed to check research status: {response.status_code} - {response.text}")
                    return {"error": f"Failed to check research status: {response.status_code} - {response.text}"}
            
            print("⏰ Research timed out - took too long to complete")
            return {"error": "Research timed out - took too long to complete"}
            
        except Exception as e:
            print(f"❌ Failed to poll research completion: {str(e)}")
            return {"error": f"Failed to poll research completion: {str(e)}"}

    def create_search_tool_schema(self):
        """Define the Exa search tool schema for ASI:One with intelligent reasoning"""
        return {
            "type": "function",
            "function": {
                "name": "exa_search",
                "description": "Perform comprehensive web research using Exa AI to gather the most recent and relevant information. Use this tool when the query requires current information, specific entity research, or comprehensive analysis that goes beyond general knowledge. The tool provides detailed analysis including news, product launches, controversies, brand perception, market trends, and everything else related to the query.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The brand, company, product, topic, or entity to research comprehensively"
                        }
                    },
                    "required": ["query"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }

    def process_search_query(self, user_query: str) -> str:
        """Process user query using ASI:One with Exa search tool"""
        try:
            search_tool = self.create_search_tool_schema()
            
            # Enhanced system prompt that encourages intelligent reasoning about tool usage
            system_prompt = """You are a comprehensive research assistant with access to real-time information through the exa_search tool. 

Your task is to intelligently decide when to use the exa_search tool based on the nature of the query. Consider the following factors:

DECISION CRITERIA FOR TOOL USAGE:
1. CURRENT INFORMATION NEEDED: Does the query require recent, up-to-date information that might not be in your training data?
2. SPECIFIC ENTITIES: Is the query about specific brands, companies, products, people, or events that have ongoing developments?
3. RESEARCH DEPTH: Does the user want comprehensive analysis, news, controversies, or market trends?
4. TIME-SENSITIVE: Are they asking about "latest", "recent", "current", or "what's happening with" something?
5. FACTUAL VERIFICATION: Do they need verified, sourced information rather than general knowledge?

USE THE TOOL WHEN:
- Querying about specific brands, companies, or products (regardless of how well-known)
- Asking for recent news, developments, or current events
- Requesting comprehensive research or analysis
- Seeking information about controversies, market trends, or reputation
- Asking "what's happening with", "latest news about", or "current status of"
- Requesting detailed brand analysis or company research

DO NOT USE THE TOOL WHEN:
- Asking general knowledge questions that don't require current information
- Requesting explanations of concepts, definitions, or how-to guides
- Asking for personal advice or opinions
- Simple factual questions that are well-established and unlikely to change

EXAMPLES:
✅ USE TOOL: "Research Tesla brand", "Latest news about Apple", "What's happening with OpenAI?", "Analyze Nike controversies"
❌ DON'T USE: "What is machine learning?", "How to code in Python?", "Explain quantum physics", "What are the benefits of exercise?"

After using the tool, provide detailed analysis with proper source citations and focus on the most recent and relevant information.
"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]

            # Let ASI:One decide whether to use the tool based on reasoning
            payload = {
                "model": "asi1-extended",
                "messages": messages,
                "tools": [search_tool],
                "tool_choice": "auto",  # Let the model decide intelligently
                "temperature": 0.3
            }

            print(f"Making ASI:One request with tool_choice: {payload['tool_choice']}")
            
            response = requests.post(
                f"{ASI_BASE_URL}/chat/completions",
                headers=ASI_HEADERS,
                json=payload
            )

            if response.status_code != 200:
                return f"ASI:One API error: {response.status_code} - {response.text}"

            response_data = response.json()
            print(f"ASI:One response: {json.dumps(response_data, indent=2)}")
            
            if "choices" not in response_data or not response_data["choices"]:
                return "No response received from ASI:One"

            choice = response_data["choices"][0]["message"]
            
            # Check if the model wants to call a tool
            if "tool_calls" in choice and choice["tool_calls"]:
                print("Tool calls detected!")
                # Process tool calls
                messages.append({
                    "role": "assistant",
                    "content": choice.get("content", ""),
                    "tool_calls": choice["tool_calls"]
                })
                
                for tool_call in choice["tool_calls"]:
                    print(f"🔧 Processing tool call: {tool_call}")
                    if tool_call["function"]["name"] == "exa_search":
                        # Parse arguments
                        args = json.loads(tool_call["function"]["arguments"])
                        print(f"🔍 Search arguments: {args}")
                        
                        # Execute Exa search
                        print("🚀 Executing Exa search...")
                        search_result = self.exa_search(query=args["query"])
                        
                        print(f"📊 Search result status: {'✅ Success' if search_result.get('success') else '❌ Error'}")
                        if search_result.get('success'):
                            print(f"📄 Data keys: {list(search_result.get('data', {}).keys())}")
                            print(f"📚 Sources: {len(search_result.get('sources', []))}")
                        else:
                            print(f"❌ Error details: {search_result.get('error', 'Unknown error')}")
                        
                        print(f"📋 Full search result: {json.dumps(search_result, indent=2)}")
                        
                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "content": json.dumps(search_result)
                        })

                # Send updated conversation back to ASI:One for final response
                print("📤 Sending final request to ASI:One with search results...")
                final_payload = {
                    "model": "asi1-extended",
                    "messages": messages,
                    "tools": [search_tool],
                    "temperature": 0.3 # Increased for comprehensive responses
                }

                final_response = requests.post(
                    f"{ASI_BASE_URL}/chat/completions",
                    headers=ASI_HEADERS,
                    json=final_payload
                )

                print(f"📥 Final ASI:One response status: {final_response.status_code}")
                
                if final_response.status_code == 200:
                    final_data = final_response.json()
                    print(f"📄 Final response data: {json.dumps(final_data, indent=2)}")
                    
                    if "choices" in final_data and final_data["choices"]:
                        final_content = final_data["choices"][0]["message"]["content"]
                        print(f"✅ Final response content length: {len(final_content)} characters")
                        return final_content
                    else:
                        print("❌ No choices in final response")
                        return "No final response received from ASI:One"
                else:
                    print(f"❌ Final ASI:One API error: {final_response.status_code} - {final_response.text}")
                    return f"Final ASI:One API error: {final_response.status_code} - {final_response.text}"
            
            else:
                print("No tool calls made by ASI:One")
                # Return the direct response - the model has reasoned that tool usage is not needed
                return choice.get("content", "No response content received")

        except json.JSONDecodeError as e:
            return f"JSON parsing error: {str(e)}"
        except requests.RequestException as e:
            return f"Request error: {str(e)}"
        except Exception as e:
            return f"Unexpected error: {str(e)}"

# Initialize the web search agent
web_search_agent = WebSearchAgent()

# Create uAgent
agent = Agent(
    name="brandx_web_search_agent",
    port=8080,
    seed="brandx web search agent seed v10",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)

# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Startup Handler
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"ASI:One Exa Research Agent started with address: {ctx.agent.address}")
    ctx.logger.info("Agent is ready to intelligently decide when to perform research using ASI:One and Exa!")
    ctx.logger.info("The agent will reason about whether queries need current information or can be answered with general knowledge")
    ctx.logger.info("REST API endpoint available at: http://localhost:8081/research/brand")

# Message Handler
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Received message from {sender}")
    
    # Extract text content from the message
    user_query = ""
    for item in msg.content:
        if isinstance(item, TextContent):
            user_query = item.text
            break
    
    if not user_query:
        ctx.logger.warning("No text content found in message")
        return

    ctx.logger.info(f"Processing research query: {user_query}")
    
    try:
        # Process the query using ASI:One with Exa search
        response_text = web_search_agent.process_search_query(user_query)
        
        # Send response back to sender
        response_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=response_text)]
        )
        
        await ctx.send(sender, response_msg)
        ctx.logger.info(f"Sent research response to {sender}")
        
    except Exception as e:
        error_msg = f"Error processing research query: {str(e)}"
        ctx.logger.error(error_msg)
        
        error_response = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=error_msg)]
        )
        
        await ctx.send(sender, error_response)

# Acknowledgement Handler
@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Received acknowledgement from {sender} for message: {msg.acknowledged_msg_id}")

# REST API Handler for Brand Research
@agent.on_rest_post("/research/brand", BrandResearchRequest, BrandResearchResponse)
async def handle_brand_research(ctx: Context, req: BrandResearchRequest) -> BrandResearchResponse:
    ctx.logger.info(f"Received brand research request for: {req.brand_name}")
    
    try:
        # Process the brand research query using the existing web search agent
        research_query = f"Research {req.brand_name} brand comprehensively"
        response_text = web_search_agent.process_search_query(research_query)
        
        ctx.logger.info(f"Brand research completed for: {req.brand_name}")
        
        return BrandResearchResponse(
            success=True,
            brand_name=req.brand_name,
            research_result=response_text,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing brand research for {req.brand_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandResearchResponse(
            success=False,
            brand_name=req.brand_name,
            research_result=error_msg,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting ASI:One Exa Research Agent...")
    print(f"✅ Agent address: {agent.address}")
    print("📡 Ready to intelligently decide when to research vs. answer directly")
    print("🧠 Powered by ASI:One AI reasoning and Exa Research")
    print("\n🌐 REST API Endpoint:")
    print("POST http://localhost:8081/research/brand")
    print("Body: {\"brand_name\": \"Tesla\"}")
    print("\n🧪 Test queries (agent will decide whether to research):")
    print("- 'Research Tesla brand comprehensively' (will research)")
    print("- 'What is machine learning?' (will answer directly)")
    print("- 'Latest news about Apple' (will research)")
    print("- 'How to code in Python?' (will answer directly)")
    print("- 'What's happening with OpenAI?' (will research)")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ASI:One Exa Research Agent...")
        print("✅ Agent stopped.")