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
SOCIAL_MCP_ENDPOINT = os.environ.get("SOCIAL_MCP", "https://socialsmcp-739298578243.us-central1.run.app/scrape-social-commentss")

if not ASI_ONE_API_KEY:
    raise ValueError("Please set ASI_ONE_API_KEY environment variable")
if not AGENTVERSE_API_KEY:
    raise ValueError("Please set AGENTVERSE_API_KEY environment variable")

# REST API Models
class NegativeSocialMediaRequest(Model):
    brand_name: str

class NegativeSocialMediaResponse(Model):
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

class NegativeSocialMediaSearchAgent:
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
                "description": "Search for negative social media comments and feedback from Instagram posts. Use this tool when users want to find negative social media comments, Instagram discussions, or community complaints about a particular brand or company. This tool scrapes and analyzes Instagram comments from the brand's official account to provide negative sentiment-filtered results.",
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
3. NEGATIVE SENTIMENT: Are they looking for negative social media comments or community complaints?
4. COMMUNITY RESEARCH: Do they want to understand Instagram community sentiment or discussions?

USE THE TOOL WHEN:
- Asking for negative social media comments about a brand
- Requesting Instagram comments or community complaints about brands
- Wanting to know what Instagram users complain about regarding a brand
- Seeking Instagram community negative sentiment insights
- Asking about Instagram comments or posts from brand accounts
- Looking for Instagram discussions or community complaints
- Requesting sentiment analysis of Instagram comments
- Asking for Instagram user negative experiences or opinions

DO NOT USE THE TOOL WHEN:
- Asking general questions about brands without social media focus
- Requesting company information, financials, or news
- General knowledge questions not related to social media
- Technical specifications or product features (unless specifically about social media mentions)
- Historical information or company background
- Questions not related to Instagram community discussions

MOST IMPORTANT: Talk about the Instagram comments from Instagram community and brand accounts, not from ANY OTHER sources.

EXAMPLES:
✅ USE TOOL: "Find negative Instagram comments for Apple", "What do Instagram users complain about Nike?", "Show me Instagram comments about Tesla problems", "Instagram complaints for Starbucks"
❌ DON'T USE: "What is Tesla's stock price?", "When was Apple founded?", "Nike company history", "Starbucks locations"

When using the tool, focus on finding negative social media comments and community complaints.

CRITICAL REQUIREMENT FOR RESPONSES AFTER USING THE TOOL:
YOU MUST ANALYZE ALL INSTAGRAM COMMENTS AND EXTRACT ONLY THE MOST NEGATIVE ONES, THEN PROVIDE A SINGLE PARAGRAPH SUMMARY OF THE ISSUES AND PROBLEMS PEOPLE HAVE WITH THE BRAND.

MANDATORY RESPONSE FORMAT AFTER TOOL USAGE:
1. ANALYZE ALL Instagram comments from the tool response
2. IDENTIFY and EXTRACT only the MOST NEGATIVE comments (those expressing complaints, dissatisfaction, problems, issues, or criticism)
3. FILTER OUT any positive, neutral, or supportive comments completely
4. CREATE A SINGLE PARAGRAPH that summarizes the main issues and problems people have with the brand based on the negative comments
5. INCLUDE specific negative quotes from Instagram users to support your analysis
6. FOCUS on themes like: product defects, poor customer service, quality issues, pricing concerns, technical problems, etc.
7. PRESENT the analysis as a cohesive narrative about negative brand perception and issues

REQUIRED ANALYSIS APPROACH:
- Read through ALL comments in the tool response
- Identify comments with negative sentiment indicators (complaints, "terrible", "awful", "hate", "worst", "broken", "defective", "overpriced", etc.)
- Extract the most critical and negative user experiences
- Group negative themes together (quality issues, customer service, pricing, technical problems, etc.)
- Write ONE comprehensive paragraph explaining the main issues people have with the brand

FORBIDDEN ACTIONS:
- Do NOT list individual comments separately
- Do NOT include positive or neutral comments
- Do NOT provide multiple paragraphs
- Do NOT use bullet points or numbered lists
- Do NOT include emojis in your response
- Do NOT provide raw comment data

Your response should be ONE SINGLE PARAGRAPH that analyzes the negative sentiment and explains the main issues and problems people have with the brand based on their Instagram comments.
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

# Initialize the negative social media search agent
negative_social_media_search_agent = NegativeSocialMediaSearchAgent()


# Create uAgent
agent = Agent(
    name="brandx_negative_social_media_search_agent",
    port=8080,  # Different port from positive agent
    seed="brandx negative social media search agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)


# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Startup Handler
@agent.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"ASI:One Negative Social Media Search Agent started with address: {ctx.agent.address}")
    ctx.logger.info(f"Social Media endpoint configured: {SOCIAL_MCP_ENDPOINT}")
    ctx.logger.info("Agent is ready to intelligently search for negative social media comments using ASI:One!")
    ctx.logger.info("The agent will reason about whether queries need negative social media comment searches or can be answered directly")
    ctx.logger.info("REST API endpoint available at: http://localhost:8080/social/negative")

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

    ctx.logger.info(f"Processing negative social media query: {user_query}")
    
    try:
        # Process the query using ASI:One with social media search
        response_text = negative_social_media_search_agent.process_social_media_query(user_query)
        
        # Send response back to sender
        response_msg = ChatMessage(
            timestamp=datetime.utcnow(),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=response_text)]
        )
        
        await ctx.send(sender, response_msg)
        ctx.logger.info(f"Sent negative social media response to {sender}")
        
    except Exception as e:
        error_msg = f"Error processing negative social media query: {str(e)}"
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

# REST API Handler for Negative Social Media
@agent.on_rest_post("/social/negative", NegativeSocialMediaRequest, NegativeSocialMediaResponse)
async def handle_negative_social_media(ctx: Context, req: NegativeSocialMediaRequest) -> NegativeSocialMediaResponse:
    ctx.logger.info(f"Received negative social media request for: {req.brand_name}")
    
    try:
        # Process the negative social media query using the existing social media search agent
        social_query = f"Find negative Instagram comments for {req.brand_name}"
        response_text = negative_social_media_search_agent.process_social_media_query(social_query)
        
        ctx.logger.info(f"Negative social media search completed for: {req.brand_name}")
        
        return NegativeSocialMediaResponse(
            success=True,
            brand_name=req.brand_name,
            social_media_result=response_text,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing negative social media for {req.brand_name}: {str(e)}"
        ctx.logger.error(error_msg)
        
        return NegativeSocialMediaResponse(
            success=False,
            brand_name=req.brand_name,
            social_media_result=error_msg,
            timestamp=datetime.utcnow().isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting ASI:One Negative Social Media Search Agent...")
    print(f"✅ Agent address: {agent.address}")
    print(f"🔗 Social Media endpoint: {SOCIAL_MCP_ENDPOINT}")
    print("📡 Ready to intelligently search for negative social media comments")
    print("🧠 Powered by ASI:One AI reasoning and Social Media MCP")
    print("\n🌐 REST API Endpoint:")
    print("POST http://localhost:8080/social/negative")
    print("Body: {\"brand_name\": \"Apple\"}")
    print("\n🧪 Test queries (agent will decide whether to search negative social media comments):")
    print("- 'Find negative Instagram comments for Apple' (will search negative social media comments)")
    print("- 'What do Instagram users complain about Nike?' (will search negative social media comments)")
    print("- 'Show me Instagram comments about Tesla problems' (will search negative social media comments)")
    print("- 'What is Tesla's stock price?' (will answer directly)")
    print("- 'Instagram complaints for Starbucks' (will search negative social media comments)")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ASI:One Negative Social Media Search Agent...")
        print("✅ Agent stopped.")