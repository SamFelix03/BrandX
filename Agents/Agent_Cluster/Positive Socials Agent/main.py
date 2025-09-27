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
SOCIAL_MCP_ENDPOINT = os.environ.get("SOCIAL_MCP", "https://socialsmcp-739298578243.us-central1.run.app/scrape-social-comments")

if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")
if not AGENTVERSE_API_KEY:
    raise ValueError("Please set AGENTVERSE_API_KEY environment variable")

# REST API Models
class PositiveSocialMediaRequest(Model):
    brand_name: str

class PositiveSocialMediaResponse(Model):
    success: bool
    brand_name: str
    social_media_result: str
    timestamp: str
    agent_address: str

# ASI:One API configuration
ASI_BASE_URL = "https://api.asi1.ai/v1"
ASI_HEADERS = {
    "Authorization": f"Bearer {ASI_ONE_API_KEY}",
    "Content-Type": "application/json"
}

class SocialMediaSearchAgent:
    def __init__(self):
        self.social_endpoint = SOCIAL_MCP_ENDPOINT
        
    def search_social_media_comments(self, brand_name: str) -> dict:
        """Search for social media comments using the Social Media MCP endpoint"""
        try:
            print(f"🔍 Starting social media search for brand: '{brand_name}'")
            
            # Prepare request payload
            payload = {
                "brand_name": brand_name
            }
            
            print(f"📤 Sending request to Social Media endpoint: {self.social_endpoint}")
            print(f"📤 Request payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                self.social_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📥 Social Media API response status: {response.status_code}")
            print(f"📥 Social Media API response: {response.text}")
            
            if response.status_code == 200:
                social_data = response.json()
                print("✅ Social media search completed successfully!")
                
                return {
                    "success": True,
                    "data": social_data,
                    "brand_name": brand_name
                }
            else:
                print(f"❌ Social Media API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"Social Media API error: {response.status_code} - {response.text}",
                    "brand_name": brand_name
                }
                
        except Exception as e:
            print(f"❌ Social media search failed with exception: {str(e)}")
            return {
                "success": False,
                "error": f"Social media search failed: {str(e)}",
                "brand_name": brand_name
            }

    def create_social_media_tool_schema(self):
        """Define the social media search tool schema for ASI:One with intelligent reasoning"""
        return {
            "type": "function",
            "function": {
                "name": "search_social_media_comments",
                "description": "Search for positive social media comments and feedback from Instagram posts. Use this tool when users want to find positive social media comments, Instagram discussions, or community feedback about a particular brand or company. This tool scrapes and analyzes Instagram comments from the brand's official account to provide positive sentiment-filtered results.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "brand_name": {
                            "type": "string",
                            "description": "The brand or company name to search social media comments for"
                        }
                    },
                    "required": ["brand_name"],
                    "additionalProperties": False
                },
                "strict": True
            }
        }

    def process_social_media_query(self, user_query: str) -> str:
        """Process user query using ASI:One with social media search tool"""
        try:
            social_tool = self.create_social_media_tool_schema()
            
            # Enhanced system prompt that encourages intelligent reasoning about tool usage
            system_prompt = """You are a specialized social media research assistant with access to a powerful Instagram comments search tool. 

Your task is to intelligently decide when to use the search_social_media_comments tool based on the nature of the query. Consider the following factors:

DECISION CRITERIA FOR TOOL USAGE:
1. SOCIAL MEDIA REQUESTS: Does the query ask for social media comments, Instagram posts, or community feedback?
2. BRAND/COMPANY FOCUS: Is the query about specific brands or companies?
3. POSITIVE SENTIMENT: Are they looking for positive social media comments or community feedback?
4. COMMUNITY RESEARCH: Do they want to understand Instagram community sentiment or discussions?

USE THE TOOL WHEN:
- Asking for positive social media comments about a brand
- Requesting Instagram comments or community feedback about brands
- Wanting to know what Instagram users discuss about a brand
- Seeking Instagram community sentiment insights
- Asking about Instagram comments or posts from brand accounts
- Looking for Instagram discussions or community feedback
- Requesting sentiment analysis of Instagram comments
- Asking for Instagram user experiences or opinions

DO NOT USE THE TOOL WHEN:
- Asking general questions about brands without social media focus
- Requesting company information, financials, or news
- General knowledge questions not related to social media
- Technical specifications or product features (unless specifically about social media mentions)
- Historical information or company background
- Questions not related to Instagram community discussions

MOST IMPORTANT: Talk about the Instagram comments from Instagram community and brand accounts, not from ANY OTHER sources.

EXAMPLES:
✅ USE TOOL: "Find positive Instagram comments for Apple", "What do Instagram users discuss about Nike?", "Show me Instagram comments about Tesla products", "Instagram feedback for Starbucks"
❌ DON'T USE: "What is Tesla's stock price?", "When was Apple founded?", "Nike company history", "Starbucks locations"

When using the tool, focus on finding positive social media comments and community feedback.

CRITICAL REQUIREMENT FOR RESPONSES AFTER USING THE TOOL:
YOU MUST ANALYZE ALL INSTAGRAM COMMENTS AND EXTRACT ONLY THE MOST POSITIVE ONES, THEN PROVIDE A SINGLE PARAGRAPH SUMMARY OF HOW PEOPLE VIEW THE BRAND POSITIVELY.

MANDATORY RESPONSE FORMAT AFTER TOOL USAGE:
1. ANALYZE ALL Instagram comments from the tool response
2. IDENTIFY and EXTRACT only the MOST POSITIVE comments (those expressing love, admiration, satisfaction, excitement, or praise)
3. FILTER OUT any negative, neutral, or critical comments completely
4. CREATE A SINGLE PARAGRAPH that summarizes how people view the brand positively based on the most positive comments
5. INCLUDE specific positive quotes from Instagram users to support your analysis
6. FOCUS on themes like: product quality, user experience, brand loyalty, innovation, design, performance, etc.
7. PRESENT the analysis as a cohesive narrative about positive brand perception

REQUIRED ANALYSIS APPROACH:
- Read through ALL comments in the tool response
- Identify comments with positive sentiment indicators (❤️, 🔥, 😍, "love", "amazing", "best", "perfect", "awesome", etc.)
- Extract the most enthusiastic and positive user experiences
- Group positive themes together (quality, innovation, design, user experience, etc.)
- Write ONE comprehensive paragraph explaining how people positively view the brand

FORBIDDEN ACTIONS:
- Do NOT list individual comments separately
- Do NOT include negative or neutral comments
- Do NOT provide multiple paragraphs
- Do NOT use bullet points or numbered lists
- Do NOT include emojis in your response
- Do NOT provide raw comment data

Your response should be ONE SINGLE PARAGRAPH that analyzes the positive sentiment and explains how people view the brand favorably based on their Instagram comments.
"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]

            # Let ASI:One decide whether to use the tool based on reasoning
            payload = {
                "model": "asi1-extended",
                "messages": messages,
                "tools": [social_tool],
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
                    if tool_call["function"]["name"] == "search_social_media_comments":
                        # Parse arguments
                        args = json.loads(tool_call["function"]["arguments"])
                        print(f"🔍 Social media search arguments: {args}")
                        
                        # Execute social media search
                        print("🚀 Executing social media search...")
                        search_result = self.search_social_media_comments(
                            brand_name=args["brand_name"]
                        )
                        
                        print(f"📊 Social media search result status: {'✅ Success' if search_result.get('success') else '❌ Error'}")
                        if search_result.get('success'):
                            print(f"📄 Social media data available for: {search_result.get('brand_name')}")
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
                print("📤 Sending final request to ASI:One with social media results...")
                final_payload = {
                    "model": "asi1-extended",
                    "messages": messages,
                    "tools": [social_tool],
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

# Initialize the social media search agent
social_media_search_agent = SocialMediaSearchAgent()


# Create uAgent
agent = Agent(
    name="brandx_positive_social_media_search_agent",
    port=8080,  # Different port from other agents
    seed="brandx positive social media search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)


# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Startup Handler
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"ASI:One Positive Social Media Search Agent started with address: {ctx.agent.address}")
    ctx.logger.info(f"Social Media endpoint configured: {SOCIAL_MCP_ENDPOINT}")
    ctx.logger.info("Agent is ready to intelligently search for positive social media comments using ASI:One!")
    ctx.logger.info("The agent will reason about whether queries need positive social media comment searches or can be answered directly")
    ctx.logger.info("REST API endpoint available at: http://localhost:8080/social/positive")

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

    ctx.logger.info(f"Processing positive social media query: {user_query}")
    
    try:
        # Process the query using ASI:One with social media search
        response_text = social_media_search_agent.process_social_media_query(user_query)
        
        # Send response back to sender
        response_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=response_text)]
        )
        
        await ctx.send(sender, response_msg)
        ctx.logger.info(f"Sent positive social media response to {sender}")
        
    except Exception as e:
        error_msg = f"Error processing positive social media query: {str(e)}"
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

# REST API Handler for Positive Social Media
@agent.on_rest_post("/social/positive", PositiveSocialMediaRequest, PositiveSocialMediaResponse)
async def handle_positive_social_media(ctx: Context, req: PositiveSocialMediaRequest) -> PositiveSocialMediaResponse:
    ctx.logger.info(f"Received positive social media request for: {req.brand_name}")
    
    try:
        # Process the positive social media query using the existing social media search agent
        social_query = f"Find positive Instagram comments for {req.brand_name}"
        response_text = social_media_search_agent.process_social_media_query(social_query)
        
        ctx.logger.info(f"Positive social media search completed for: {req.brand_name}")
        
        return PositiveSocialMediaResponse(
            success=True,
            brand_name=req.brand_name,
            social_media_result=response_text,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing positive social media for {req.brand_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return PositiveSocialMediaResponse(
            success=False,
            brand_name=req.brand_name,
            social_media_result=error_msg,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting ASI:One Positive Social Media Search Agent...")
    print(f"✅ Agent address: {agent.address}")
    print(f"🔗 Social Media endpoint: {SOCIAL_MCP_ENDPOINT}")
    print("📡 Ready to intelligently search for positive social media comments")
    print("🧠 Powered by ASI:One AI reasoning and Social Media MCP")
    print("\n🌐 REST API Endpoint:")
    print("POST http://localhost:8080/social/positive")
    print("Body: {\"brand_name\": \"Apple\"}")
    print("\n🧪 Test queries (agent will decide whether to search positive social media comments):")
    print("- 'Find positive Instagram comments for Apple' (will search positive social media comments)")
    print("- 'What do Instagram users discuss about Nike?' (will search positive social media comments)")
    print("- 'Show me Instagram comments about Tesla products' (will search positive social media comments)")
    print("- 'What is Tesla's stock price?' (will answer directly)")
    print("- 'Instagram feedback for Starbucks' (will search positive social media comments)")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ASI:One Positive Social Media Search Agent...")
        print("✅ Agent stopped.")