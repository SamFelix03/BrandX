from datetime import datetime, timezone
from uuid import uuid4
from typing import Any, Dict, List, Optional, Union
import json
import os
from dotenv import load_dotenv
from uagents import Context, Model, Protocol, Agent
import requests

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)

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
    name="xbot_agent",
    port=8080,
    seed="xbot agent seed",
    mailbox=True,
    endpoint=["http://localhost:8080/submit"]
)

# REST API Models
class BrandDefenseRequest(Model):
    negative_social_sentiment: Union[List[str], str]
    negative_reviews: Union[List[str], str]
    negative_reddit_threads: Union[List[str], str]

class BrandDefenseResponse(Model):
    success: bool
    generated_tweet: str
    twitter_posted: bool
    twitter_response: Optional[Dict] = None
    timestamp: str
    agent_address: str

# LLM Interface
class LLM:
    def __init__(self, api_key):
        from openai import OpenAI
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.asi1.ai/v1"
        )

    def create_completion(self, prompt):
        completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="asi1-mini"  # ASI:One model name
        )
        return completion.choices[0].message.content

def generate_defense_tweet(negative_data: Dict, llm: LLM) -> str:
    """Generate a positive defense tweet based on negative sentiment data."""
    
    # Extract negative data
    negative_social = negative_data.get('negative_social_sentiment', [])
    negative_reviews = negative_data.get('negative_reviews', [])
    negative_reddit = negative_data.get('negative_reddit_threads', [])
    
    # Create comprehensive negative data summary for LLM
    all_negative_data = []
    
    if negative_social:
        all_negative_data.append(f"NEGATIVE SOCIAL MEDIA:\n{chr(10).join(negative_social[:3])}")
    
    if negative_reviews:
        all_negative_data.append(f"NEGATIVE REVIEWS:\n{chr(10).join(negative_reviews[:3])}")
    
    if negative_reddit:
        all_negative_data.append(f"NEGATIVE REDDIT THREADS:\n{chr(10).join(negative_reddit[:3])}")
    
    comprehensive_negative_data = "\n\n".join(all_negative_data)
    
    # Create the defense tweet generation prompt
    prompt = f"""
You are a Brand Defense Twitter Bot specializing in creating positive, fun tweets to defend brands against negative feedback.

NEGATIVE FEEDBACK DATA:
{comprehensive_negative_data}

TASK: Generate a SINGLE positive, fun, and engaging tweet that defends the brand against the negative feedback.

REQUIREMENTS:
1. Tweet must be LESS than 150 characters
2. Must be positive and fun in tone
3. Should address the negative feedback in a clever way
4. Should defend the brand without being defensive
5. Use humor, wit, or clever wordplay when possible
6. Make it engaging and shareable
7. No hashtags unless they add value (count toward character limit)
8. No mentions unless necessary (count toward character limit)

EXAMPLES OF GOOD DEFENSE TWEETS:
- "Plot twist: Our 'bugs' are actually features that make us unique! 🐛✨"
- "Negative reviews? More like free market research! Thanks for the feedback! 📈"
- "Our customer service is so good, even our critics become fans. Try us! 😄"
- "Breaking: We're so confident in our product, we welcome the haters! 💪"
- "Fun fact: Our 'problems' are just opportunities in disguise! 🎯"

CRITICAL: Return ONLY the tweet content. No explanations, no additional text, no markdown formatting. Just the tweet itself.
"""
    
    try:
        response = llm.create_completion(prompt)
        print(f"Raw LLM response: {response[:200]}...")
        
        # Clean the response - remove any markdown formatting
        cleaned_response = response.strip()
        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        # Ensure tweet is under 150 characters
        if len(cleaned_response) > 150:
            cleaned_response = cleaned_response[:147] + "..."
        
        print(f"Generated defense tweet: {cleaned_response}")
        print(f"Tweet length: {len(cleaned_response)} characters")
        return cleaned_response
    except Exception as e:
        print(f"Error generating defense tweet: {e}")
        return "Plot twist: Our 'bugs' are actually features that make us unique! 🐛✨"

def post_tweet_to_twitter(tweet_content: str) -> Dict:
    """Post the generated tweet to the Twitter API."""
    try:
        url = "https://twitterapi-739298578243.us-central1.run.app/tweet"
        payload = {
            "content": tweet_content
        }
        
        print(f"🌐 Posting tweet to Twitter API: {url}")
        print(f"📤 Tweet content: {tweet_content}")
        
        response = requests.post(url, json=payload, timeout=30)
        print(f"📡 Twitter API response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Tweet posted successfully!")
            print(f"📊 Twitter response: {data}")
            return {"success": True, "response": data}
        else:
            print(f"❌ Twitter API error: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"❌ Error posting tweet to Twitter: {e}")
        return {"success": False, "error": str(e)}

# Initialize global components
llm = LLM(api_key=ASI_ONE_API_KEY)

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
    ctx.logger.info(f"XBot Agent started with address: {ctx.agent.address}")
    ctx.logger.info("Agent is ready to generate defense tweets and post them to Twitter!")
    ctx.logger.info("REST API endpoints available:")
    ctx.logger.info("- POST http://localhost:8080/defend")

# Chat Protocol Handlers
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages and process brand defense requests."""
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
            ctx.logger.info(f"Got a brand defense request from {sender}: {user_query}")
            
            try:
                # For chat, we'll create a simple example defense tweet
                example_negative_data = {
                    "negative_social_sentiment": ["This product is terrible", "Worst purchase ever"],
                    "negative_reviews": ["Poor quality", "Not worth the money"],
                    "negative_reddit_threads": ["Avoid this brand", "Disappointed customer"]
                }
                
                # Generate defense tweet
                defense_tweet = generate_defense_tweet(example_negative_data, llm)
                
                # Format the response
                response_text = f"**Generated Defense Tweet:**\n\n{defense_tweet}\n\n*Length: {len(defense_tweet)} characters*"
                
                # Send the response back
                await ctx.send(sender, create_text_chat(response_text))
                
            except Exception as e:
                ctx.logger.error(f"Error processing brand defense request: {e}")
                await ctx.send(
                    sender, 
                    create_text_chat("I apologize, but I encountered an error processing your brand defense request. Please try again.")
                )
        else:
            ctx.logger.info(f"Got unexpected content from {sender}")

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle chat acknowledgements."""
    ctx.logger.info(f"Got an acknowledgement from {sender} for {msg.acknowledged_msg_id}")

# REST API Handlers
@agent.on_rest_post("/defend", BrandDefenseRequest, BrandDefenseResponse)
async def handle_brand_defense(ctx: Context, req: BrandDefenseRequest) -> BrandDefenseResponse:
    """Handle brand defense requests and post tweets to Twitter."""
    ctx.logger.info(f"Received brand defense request")
    
    # Helper function to get length safely
    def get_length(value):
        if isinstance(value, str):
            return 1
        return len(value)
    
    ctx.logger.info(f"Negative social sentiment: {get_length(req.negative_social_sentiment)} items")
    ctx.logger.info(f"Negative reviews: {get_length(req.negative_reviews)} items")
    ctx.logger.info(f"Negative reddit threads: {get_length(req.negative_reddit_threads)} items")
    
    try:
        # Convert strings to lists if needed
        def ensure_list(value):
            if isinstance(value, str):
                return [value]
            return value
        
        # Prepare negative data
        negative_data = {
            "negative_social_sentiment": ensure_list(req.negative_social_sentiment),
            "negative_reviews": ensure_list(req.negative_reviews),
            "negative_reddit_threads": ensure_list(req.negative_reddit_threads)
        }
        
        # Generate defense tweet
        defense_tweet = generate_defense_tweet(negative_data, llm)
        
        # Post tweet to Twitter API
        twitter_result = post_tweet_to_twitter(defense_tweet)
        
        return BrandDefenseResponse(
            success=True,
            generated_tweet=defense_tweet,
            twitter_posted=twitter_result["success"],
            twitter_response=twitter_result.get("response") if twitter_result["success"] else None,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing brand defense request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return BrandDefenseResponse(
            success=False,
            generated_tweet="",
            twitter_posted=False,
            twitter_response={"error": error_msg},
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🤖 Starting XBot Agent...")
    print(f"✅ Agent address: {agent.address}")
    print("📡 Ready to generate defense tweets and post them to Twitter!")
    print("🧠 Powered by ASI:One AI reasoning")
    print("\n🌐 REST API Endpoints:")
    print("POST http://localhost:8080/defend")
    print("Body: {")
    print('  "negative_social_sentiment": ["This product is terrible", "Worst purchase ever"],')
    print('  "negative_reviews": ["Poor quality", "Not worth the money"],')
    print('  "negative_reddit_threads": ["Avoid this brand", "Disappointed customer"]')
    print("}")
    print("Returns: Generated defense tweet and Twitter posting status")
    print("\n🧪 Test queries:")
    print("- 'Generate a defense tweet'")
    print("- 'Create a positive response'")
    print("- 'Defend our brand'")
    print("\n📊 XBot Features:")
    print("- Analyzes negative sentiment data")
    print("- Generates fun, positive defense tweets")
    print("- Posts tweets directly to Twitter API")
    print("- Tweets under 150 characters")
    print("- Witty and engaging responses")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down XBot Agent...")
        print("✅ Agent stopped.")