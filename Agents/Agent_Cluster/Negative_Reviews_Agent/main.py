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

# Set your API keys and endpoints
ASI_ONE_API_KEY = os.environ.get("ASI_ONE_API_KEY")
AGENTVERSE_API_KEY = os.environ.get("AGENTVERSE_API_KEY")
REVIEWS_MCP_ENDPOINT = os.environ.get("REVIEWS_MCP", "https://reviewsmcp-739298578243.us-central1.run.app/scrape-reviews")

if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")
if not AGENTVERSE_API_KEY:
    raise ValueError("Please set AGENTVERSE_API_KEY environment variable")

# REST API Models
class NegativeReviewsRequest(Model):
    brand_name: str
    sentiment: str = "negative"  # Default to negative reviews

class NegativeReviewsResponse(Model):
    success: bool
    brand_name: str
    sentiment: str
    reviews_result: str
    timestamp: str
    agent_address: str

# ASI:One API configuration
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}

class ReviewsSearchAgent:
    def __init__(self):
        self.reviews_endpoint = REVIEWS_MCP_ENDPOINT
        
    def search_reviews(self, brand_name: str, sentiment: str = "negative") -> dict:
        """Search for brand reviews using the reviews MCP endpoint"""
        try:
            print(f"🔍 Starting reviews search for brand: '{brand_name}' with sentiment: '{sentiment}'")
            
            # Prepare request payload
            payload = {
                "brand_name": brand_name,
                "sentiment": sentiment
            }
            
            print(f"📤 Sending request to reviews endpoint: {self.reviews_endpoint}")
            print(f"📤 Request payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                self.reviews_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📥 Reviews API response status: {response.status_code}")
            print(f"📥 Reviews API response: {response.text}")
            
            if response.status_code == 200:
                reviews_data = response.json()
                print("✅ Reviews search completed successfully!")
                
                return {
                    "success": True,
                    "data": reviews_data,
                    "brand_name": brand_name,
                    "sentiment": sentiment
                }
            else:
                print(f"❌ Reviews API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Reviews API error: {response.status_code} - {response.text}",
                    "brand_name": brand_name,
                    "sentiment": sentiment
                }
                
        except Exception as e:
            print(f"❌ Reviews search failed with exception: {str(e)}")
            return {
                "success": False,
                "error": f"Reviews search failed: {str(e)}",
                "brand_name": brand_name,
                "sentiment": sentiment
            }

    def create_reviews_tool_schema(self):
        """Define the reviews search tool schema for ASI:One with intelligent reasoning"""
        return {
            "type": "function",
            "function": {
                "name": "search_reviews",
                "description": "Search for brand reviews with specific sentiment analysis. Use this tool when users want to find negative reviews for a particular brand, product, or company. This tool scrapes and analyzes reviews from various sources to provide sentiment-filtered results.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "brand_name": {
                            "type": "string",
                            "description": "The brand, company, or product name to search reviews for"
                        },
                        "sentiment": {
                            "type": "string",
                            "description": "The sentiment filter for reviews ('positive' or 'negative')",
                            "enum": ["positive", "negative"],
                            "default": "negative"
                        }
                    },
                    "required": ["brand_name"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }

    def process_reviews_query(self, user_query: str) -> str:
        """Process user query using ASI:One with reviews search tool"""
        try:
            reviews_tool = self.create_reviews_tool_schema()
            
            # Enhanced system prompt that encourages intelligent reasoning about tool usage
            system_prompt = """You are a specialized reviews research assistant with access to a powerful reviews search tool. 

Your task is to intelligently decide when to use the search_reviews tool based on the nature of the query. Consider the following factors:

DECISION CRITERIA FOR TOOL USAGE:
1. REVIEW REQUESTS: Does the query ask for reviews, testimonials, or customer feedback?
2. BRAND/PRODUCT FOCUS: Is the query about specific brands, companies, or products?
3. SENTIMENT ANALYSIS: Are they looking for negative reviews.
4. REPUTATION RESEARCH: Do they want to understand customer dissatisfaction or brand issues?

USE THE TOOL WHEN:
- Asking for negative reviews about a brand/product
- Requesting customer complaints or critical feedback
- Wanting to know what customers complain about regarding a brand
- Seeking customer dissatisfaction insights
- Asking about brand issues from customer perspective
- Looking for problems or customer complaints
- Requesting sentiment analysis of negative reviews

DO NOT USE THE TOOL WHEN:
- Asking general questions about brands without review focus
- Requesting company information, financials, or news
- General knowledge questions
- Technical specifications or product features (unless specifically about review mentions)
- Historical information or company background

MOST IMPORTANT: Talk about the reviews from review sites and not from ANY OTHER sources.

EXAMPLES:
✅ USE TOOL: "Find negative reviews for Tesla", "What do customers complain about Apple products?", "Show me bad reviews for Nike shoes", "Customer complaints for Starbucks"
❌ DON'T USE: "What is Tesla's stock price?", "When was Apple founded?", "Nike company history", "Starbucks locations"

When using the tool, default to searching for negative reviews unless the user specifically asks for positive reviews.

CRITICAL REQUIREMENT FOR RESPONSES AFTER USING THE TOOL:
YOU MUST EXTRACT AND PRESENT EXACT REVIEW QUOTES WITH THEIR SOURCES. DO NOT PROVIDE SUMMARIES, ANALYSIS, OR GENERAL THEMES.

MANDATORY RESPONSE FORMAT AFTER TOOL USAGE:
1. Extract each individual review quote EXACTLY as written in the tool response
2. For each review, you MUST include:
   - The EXACT quote in quotation marks (word-for-word from the source)
   - The reviewer name (if available)
   - The star rating (e.g., "1 star", "2 stars")
   - The review date (if available)
   - The source platform (Trustpilot, Amazon, Google Reviews, etc.)
   - The direct source link/URL (if provided)
3. Present each review as a separate, clearly formatted entry
4. Use the authentic customer language without ANY paraphrasing or summarization
5. Focus ONLY on showing real customer voices, NOT analysis or themes
6. Do NOT provide conclusions, summaries, or interpretations
7. Do NOT group reviews by themes or categories
8. Simply present the raw, authentic review quotes with their complete source information

FORBIDDEN ACTIONS:
- Do NOT summarize reviews
- Do NOT provide thematic analysis
- Do NOT group reviews by topics
- Do NOT paraphrase customer quotes
- Do NOT provide your own interpretation
- Do NOT create general conclusions about customer sentiment
- NEVER EVER talk about positive reviews, filter out and talk ONLY about negative reviews!
SIMPLY talk about the NEGATIVE reviews you just got from the tool, AND NEVER EVER YAP a lot!
Your response should be a direct presentation of actual review quotes with their sources, nothing more.
"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]

            # Let ASI:One decide whether to use the tool based on reasoning
            payload = {
                "model": "asi1-extended",
                "messages": messages,
                "tools": [reviews_tool],
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
                    if tool_call["function"]["name"] == "search_reviews":
                        # Parse arguments
                        args = json.loads(tool_call["function"]["arguments"])
                        print(f"🔍 Reviews search arguments: {args}")
                        
                        # Execute reviews search
                        print("🚀 Executing reviews search...")
                        search_result = self.search_reviews(
                            brand_name=args["brand_name"],
                            sentiment=args.get("sentiment", "negative")
                        )
                        
                        print(f"📊 Reviews search result status: {'✅ Success' if search_result.get('success') else '❌ Error'}")
                        if search_result.get('success'):
                            print(f"📄 Reviews data available for: {search_result.get('brand_name')}")
                            print(f"🎯 Sentiment filter: {search_result.get('sentiment')}")
                        else:
                            print(f"❌ Error details: {search_result.get('error', 'Unknown error')}")
                        
                        print(f"📋 Full search result keys: {list(search_result.keys())}")
                        
                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "content": json.dumps(search_result)
                        })

                # Send updated conversation back to ASI:One for final response
                print("📤 Sending final request to ASI:One with reviews results...")
                final_payload = {
                    "model": "asi1-extended",
                    "messages": messages,
                    "tools": [reviews_tool],
                    "temperature": 0.3
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

# Initialize the reviews search agent
reviews_search_agent = ReviewsSearchAgent()

# Create uAgent
agent = Agent(
    name="asi_negative_reviews_search_agent",
    port=8080,  # Different port from positive reviews agent
    seed="asi negative reviews search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)

# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Startup Handler
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"ASI:One Negative Reviews Search Agent started with address: {ctx.agent.address}")
    ctx.logger.info(f"Reviews endpoint configured: {REVIEWS_MCP_ENDPOINT}")
    ctx.logger.info("Agent is ready to intelligently search for negative brand reviews using ASI:One!")
    ctx.logger.info("The agent will reason about whether queries need negative review searches or can be answered directly")
    ctx.logger.info("REST API endpoint available at: http://localhost:8080/reviews/negative")

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

    ctx.logger.info(f"Processing negative reviews query: {user_query}")
    
    try:
        # Process the query using ASI:One with reviews search
        response_text = reviews_search_agent.process_reviews_query(user_query)
        
        # Send response back to sender
        response_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=response_text)]
        )
        
        await ctx.send(sender, response_msg)
        ctx.logger.info(f"Sent negative reviews response to {sender}")
        
    except Exception as e:
        error_msg = f"Error processing negative reviews query: {str(e)}"
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

# REST API Handler for Negative Reviews
@agent.on_rest_post("/reviews/negative", NegativeReviewsRequest, NegativeReviewsResponse)
async def handle_negative_reviews(ctx: Context, req: NegativeReviewsRequest) -> NegativeReviewsResponse:
    ctx.logger.info(f"Received negative reviews request for: {req.brand_name}")
    
    try:
        # Process the negative reviews query using the existing reviews search agent
        reviews_query = f"Find negative reviews for {req.brand_name}"
        response_text = reviews_search_agent.process_reviews_query(reviews_query)
        
        ctx.logger.info(f"Negative reviews search completed for: {req.brand_name}")
        
        return NegativeReviewsResponse(
            success=True,
            brand_name=req.brand_name,
            sentiment=req.sentiment,
            reviews_result=response_text,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing negative reviews for {req.brand_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return NegativeReviewsResponse(
            success=False,
            brand_name=req.brand_name,
            sentiment=req.sentiment,
            reviews_result=error_msg,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting ASI:One Negative Reviews Search Agent...")
    print(f"✅ Agent address: {agent.address}")
    print(f"🔗 Reviews endpoint: {REVIEWS_MCP_ENDPOINT}")
    print("📡 Ready to intelligently search for negative brand reviews")
    print("🧠 Powered by ASI:One AI reasoning and Reviews MCP")
    print("\n🌐 REST API Endpoint:")
    print("POST http://localhost:8080/reviews/negative")
    print("Body: {\"brand_name\": \"Tesla\", \"sentiment\": \"negative\"}")
    print("\n🧪 Test queries (agent will decide whether to search negative reviews):")
    print("- 'Find negative reviews for Tesla' (will search negative reviews)")
    print("- 'What do customers complain about Apple products?' (will search negative reviews)")
    print("- 'Show me bad reviews for Nike shoes' (will search negative reviews)")
    print("- 'What is Tesla's stock price?' (will answer directly)")
    print("- 'Customer complaints for Starbucks' (will search negative reviews)")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ASI:One Negative Reviews Search Agent...")
        print("✅ Agent stopped.")