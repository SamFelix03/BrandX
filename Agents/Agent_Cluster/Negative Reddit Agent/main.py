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
REDDIT_MCP_ENDPOINT = os.environ.get("REDDIT_MCP", "https://redditmcp-739298578243.us-central1.run.app/scrape-reddit-posts")

if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")
if not AGENTVERSE_API_KEY:
    raise ValueError("Please set AGENTVERSE_API_KEY environment variable")

# REST API Models
class RedditNegativeRequest(Model):
    product_name: str
    sentiment: str = "negative"  # Default to negative Reddit posts

class RedditNegativeResponse(Model):
    success: bool
    product_name: str
    sentiment: str
    reddit_result: str
    timestamp: str
    agent_address: str

# ASI:One API configuration
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}

class RedditSearchAgent:
    def __init__(self):
        self.reddit_endpoint = REDDIT_MCP_ENDPOINT
        
    def search_reddit_posts(self, product_name: str, sentiment: str = "negative") -> dict:
        """Search for Reddit posts using the Reddit MCP endpoint"""
        try:
            print(f"🔍 Starting Reddit search for product: '{product_name}' with sentiment: '{sentiment}'")
            
            # Prepare request payload
            payload = {
                "product_name": product_name,
                "sentiment": sentiment
            }
            
            print(f"📤 Sending request to Reddit endpoint: {self.reddit_endpoint}")
            print(f"📤 Request payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                self.reddit_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📥 Reddit API response status: {response.status_code}")
            print(f"📥 Reddit API response: {response.text}")
            
            if response.status_code == 200:
                reddit_data = response.json()
                print("✅ Reddit search completed successfully!")
                
                return {
                    "success": True,
                    "data": reddit_data,
                    "product_name": product_name,
                    "sentiment": sentiment
                }
            else:
                print(f"❌ Reddit API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Reddit API error: {response.status_code} - {response.text}",
                    "product_name": product_name,
                    "sentiment": sentiment
                }
                
        except Exception as e:
            print(f"❌ Reddit search failed with exception: {str(e)}")
            return {
                "success": False,
                "error": f"Reddit search failed: {str(e)}",
                "product_name": product_name,
                "sentiment": sentiment
            }

    def create_reddit_tool_schema(self):
        """Define the Reddit search tool schema for ASI:One with intelligent reasoning"""
        return {
            "type": "function",
            "function": {
                "name": "search_reddit_posts",
                "description": "Search for Reddit posts with specific sentiment analysis. Use this tool when users want to find negative Reddit posts, discussions, or threads about a particular product, brand, or company. This tool scrapes and analyzes Reddit posts from various subreddits to provide sentiment-filtered results.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_name": {
                            "type": "string",
                            "description": "The product, brand, or company name to search Reddit posts for"
                        },
                        "sentiment": {
                            "type": "string",
                            "description": "The sentiment filter for Reddit posts ('positive' or 'negative')",
                            "enum": ["positive", "negative"],
                            "default": "negative"
                        }
                    },
                    "required": ["product_name"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }

    def process_reddit_query(self, user_query: str) -> str:
        """Process user query using ASI:One with Reddit search tool"""
        try:
            reddit_tool = self.create_reddit_tool_schema()
            
            # Enhanced system prompt that encourages intelligent reasoning about tool usage
            system_prompt = """You are a specialized Reddit research assistant with access to a powerful Reddit posts search tool. 

Your task is to intelligently decide when to use the search_reddit_posts tool based on the nature of the query. Consider the following factors:

DECISION CRITERIA FOR TOOL USAGE:
1. REDDIT POST REQUESTS: Does the query ask for Reddit posts, discussions, or threads?
2. PRODUCT/BRAND FOCUS: Is the query about specific products, brands, or companies?
3. SENTIMENT ANALYSIS: Are they looking for negative Reddit posts or discussions?
4. COMMUNITY RESEARCH: Do they want to understand Reddit community sentiment or discussions?

USE THE TOOL WHEN:
- Asking for negative Reddit posts about a product/brand
- Requesting Reddit discussions or threads about products
- Wanting to know what Reddit users discuss about a brand
- Seeking Reddit community sentiment insights
- Asking about Reddit threads or posts
- Looking for Reddit discussions or community feedback
- Requesting sentiment analysis of Reddit posts
- Asking for Reddit user experiences or opinions

DO NOT USE THE TOOL WHEN:
- Asking general questions about brands without Reddit focus
- Requesting company information, financials, or news
- General knowledge questions not related to Reddit
- Technical specifications or product features (unless specifically about Reddit mentions)
- Historical information or company background
- Questions not related to Reddit community discussions

MOST IMPORTANT: Talk about the Reddit posts from Reddit communities and subreddits, not from ANY OTHER sources.

EXAMPLES:
✅ USE TOOL: "Find negative Reddit posts for iPhone", "What do Reddit users discuss about Tesla?", "Show me Reddit threads about Nike products", "Reddit discussions for Starbucks"
❌ DON'T USE: "What is Tesla's stock price?", "When was Apple founded?", "Nike company history", "Starbucks locations"

When using the tool, default to searching for negative Reddit posts unless the user specifically asks for positive Reddit posts.

CRITICAL REQUIREMENT FOR RESPONSES AFTER USING THE TOOL:
YOU MUST EXTRACT AND PRESENT EXACT REDDIT POST QUOTES WITH THEIR SOURCES. DO NOT PROVIDE SUMMARIES, ANALYSIS, OR GENERAL THEMES.

MANDATORY RESPONSE FORMAT AFTER TOOL USAGE:
1. Extract each individual Reddit post quote EXACTLY as written in the tool response
2. For each Reddit post, you MUST include:
   - The EXACT quote in quotation marks (word-for-word from the Reddit post)
   - The Reddit username (if available)
   - The subreddit name (e.g., "r/technology", "r/iPhone")
   - The post date (if available)
   - The Reddit post URL (if provided)
   - Upvote/downvote counts (if available)
3. Present each Reddit post as a separate, clearly formatted entry
4. Use the authentic Reddit user language without ANY paraphrasing or summarization
5. Focus ONLY on showing real Reddit community voices, NOT analysis or themes
6. Do NOT provide conclusions, summaries, or interpretations
7. Do NOT group Reddit posts by themes or categories
8. Simply present the raw, authentic Reddit post quotes with their complete source information

FORBIDDEN ACTIONS:
- Do NOT provide thematic analysis
- Do NOT group Reddit posts by topics
- Do NOT paraphrase Reddit user quotes
- Do NOT provide your own interpretation
- Do NOT create general conclusions about Reddit community sentiment
- NEVER EVER talk about positive Reddit posts, filter out and talk ONLY about negative Reddit posts!

Your response should be a PROPER SUMMARY of the Reddit posts, nothing more
MOST IMPORTANT: Talk about all the negative content obtained from the reddit post in a SINGLE large paragraph, nothing more. No extra line breaks, no emojis, no nothing. Just a single paragraph.
"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]

            # Let ASI:One decide whether to use the tool based on reasoning
            payload = {
                "model": "asi1-mini",
                "messages": messages,
                "tools": [reddit_tool],
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
                    if tool_call["function"]["name"] == "search_reddit_posts":
                        # Parse arguments
                        args = json.loads(tool_call["function"]["arguments"])
                        print(f"🔍 Reddit search arguments: {args}")
                        
                        # Execute Reddit search
                        print("🚀 Executing Reddit search...")
                        search_result = self.search_reddit_posts(
                            product_name=args["product_name"],
                            sentiment=args.get("sentiment", "negative")
                        )
                        
                        print(f"📊 Reddit search result status: {'✅ Success' if search_result.get('success') else '❌ Error'}")
                        if search_result.get('success'):
                            print(f"📄 Reddit data available for: {search_result.get('product_name')}")
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
                print("📤 Sending final request to ASI:One with Reddit results...")
                final_payload = {
                    "model": "asi1-extended",
                    "messages": messages,
                    "tools": [reddit_tool],
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

# Initialize the Reddit search agent
reddit_search_agent = RedditSearchAgent()

# Create uAgent
agent = Agent(
    name="brandx_negative_reddit_search_agent",
    port=8080,  # Different port from reviews agents
    seed="brandx negative reddit search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)

# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Startup Handler
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"ASI:One Negative Reddit Search Agent started with address: {ctx.agent.address}")
    ctx.logger.info(f"Reddit endpoint configured: {REDDIT_MCP_ENDPOINT}")
    ctx.logger.info("Agent is ready to intelligently search for negative Reddit posts using ASI:One!")
    ctx.logger.info("The agent will reason about whether queries need negative Reddit post searches or can be answered directly")
    ctx.logger.info("REST API endpoint available at: http://localhost:8080/reddit/negative")

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

    ctx.logger.info(f"Processing negative Reddit query: {user_query}")
    
    try:
        # Process the query using ASI:One with Reddit search
        response_text = reddit_search_agent.process_reddit_query(user_query)
        
        # Send response back to sender
        response_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=response_text)]
        )
        
        await ctx.send(sender, response_msg)
        ctx.logger.info(f"Sent negative Reddit response to {sender}")
        
    except Exception as e:
        error_msg = f"Error processing negative Reddit query: {str(e)}"
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

# REST API Handler for Reddit Negative Posts
@agent.on_rest_post("/reddit/negative", RedditNegativeRequest, RedditNegativeResponse)
async def handle_reddit_negative(ctx: Context, req: RedditNegativeRequest) -> RedditNegativeResponse:
    ctx.logger.info(f"Received Reddit negative posts request for: {req.product_name}")
    
    try:
        # Process the Reddit negative posts query using the existing Reddit search agent
        reddit_query = f"Find negative Reddit posts for {req.product_name}"
        response_text = reddit_search_agent.process_reddit_query(reddit_query)
        
        ctx.logger.info(f"Reddit negative posts search completed for: {req.product_name}")
        
        return RedditNegativeResponse(
            success=True,
            product_name=req.product_name,
            sentiment=req.sentiment,
            reddit_result=response_text,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing Reddit negative posts for {req.product_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return RedditNegativeResponse(
            success=False,
            product_name=req.product_name,
            sentiment=req.sentiment,
            reddit_result=error_msg,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting ASI:One Negative Reddit Search Agent...")
    print(f"✅ Agent address: {agent.address}")
    print(f"🔗 Reddit endpoint: {REDDIT_MCP_ENDPOINT}")
    print("📡 Ready to intelligently search for negative Reddit posts")
    print("🧠 Powered by ASI:One AI reasoning and Reddit MCP")
    print("\n🌐 REST API Endpoint:")
    print("POST http://localhost:8080/reddit/negative")
    print("Body: {\"product_name\": \"iPhone\", \"sentiment\": \"negative\"}")
    print("\n🧪 Test queries (agent will decide whether to search negative Reddit posts):")
    print("- 'Find negative Reddit posts for iPhone' (will search negative Reddit posts)")
    print("- 'What do Reddit users discuss about Tesla?' (will search negative Reddit posts)")
    print("- 'Show me Reddit threads about Nike products' (will search negative Reddit posts)")
    print("- 'What is Tesla's stock price?' (will answer directly)")
    print("- 'Reddit discussions for Starbucks' (will search negative Reddit posts)")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ASI:One Negative Reddit Search Agent...")
        print("✅ Agent stopped.")