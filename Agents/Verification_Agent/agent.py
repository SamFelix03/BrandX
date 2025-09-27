from datetime import datetime, timezone
from uuid import uuid4
from typing import Any, Dict, List, Optional
import base64
import io
from PIL import Image
import os
import re
import requests
from dotenv import load_dotenv
from uagents import Context, Model, Protocol, Agent
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
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("Please set OPENAI_API_KEY environment variable")

# Initialize agent
agent = Agent(
    name="brandx_verification_bot",
    port=8080,
    seed="brandx verification bot agent seed",
    mailbox=True,
    endpoint=["https://imagechatbot-739298578243.us-central1.run.app/submit"]
)

# REST API Models
class ImageChatRequest(Model):
    prompt: str
    image_data: Optional[str] = None  # Base64 encoded image
    image_url: Optional[str] = None   # URL to image

class ImageChatResponse(Model):
    success: bool
    response: str
    timestamp: str
    agent_address: str
    error: Optional[str] = None

class ChatRequest(Model):
    message: str
    image_data: Optional[str] = None  # Base64 encoded image
    image_url: Optional[str] = None   # URL to image

class ChatResponse(Model):
    success: bool
    response: str
    timestamp: str
    agent_address: str
    error: Optional[str] = None

# Bounty verification models
class BountyInfo(Model):
    contract_address: str
    user_address: str
    bounty_id: int
    description: str

class BountyCompletionRequest(Model):
    contractAddress: str
    userAddress: str
    bountyId: int

# Initialize global components
llm_client = None

class LLM:
    def __init__(self, api_key):
        # Using OpenAI client directly
        from openai import OpenAI
        self.client = OpenAI(
            api_key=api_key
            # No base_url - using OpenAI's default endpoint
        )

    def create_completion(self, prompt):
        # Using OpenAI GPT-4 model for text reasoning
        completion = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o-mini"  # OpenAI GPT-4o-mini for cost-effective text processing
        )
        return completion.choices[0].message.content

    def analyze_image_with_vision(self, image_data: str, prompt: str):
        """Analyze image using OpenAI GPT-4 Vision."""
        try:
            # Create vision completion with image
            completion = self.client.chat.completions.create(
                model="gpt-4o",  # OpenAI GPT-4o with vision capabilities
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"Error analyzing image with vision: {str(e)}"

def process_image(image_data: str) -> str:
    """Process base64 encoded image and return description."""
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Get image info
        width, height = image.size
        format_type = image.format
        mode = image.mode
        
        return f"Image processed: {width}x{height} pixels, format: {format_type}, mode: {mode}"
    except Exception as e:
        return f"Error processing image: {str(e)}"

def process_image_url(image_url: str) -> tuple[str, str]:
    """Process image from URL and return base64 data and description."""
    try:
        import requests
        
        # Fetch image from URL
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Convert to base64
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        
        # Open image from bytes for metadata
        image = Image.open(io.BytesIO(response.content))
        
        # Get image info
        width, height = image.size
        format_type = image.format
        mode = image.mode
        file_size = len(response.content)
        
        description = f"Image from URL processed: {width}x{height} pixels, format: {format_type}, mode: {mode}, size: {file_size} bytes"
        
        return image_base64, description
    except Exception as e:
        return None, f"Error processing image URL: {str(e)}"

def parse_bounty_info(text: str) -> Optional[BountyInfo]:
    """Parse bounty information from input text."""
    try:
        # Extract contract address (0x followed by 40 hex characters)
        contract_match = re.search(r'contract address.*?(0x[a-fA-F0-9]{40})', text, re.IGNORECASE)
        
        # Extract user address (0x followed by 40 hex characters)
        user_match = re.search(r'user address.*?(0x[a-fA-F0-9]{40})', text, re.IGNORECASE)
        
        # Extract bounty ID (number)
        bounty_id_match = re.search(r'bounty id.*?(\d+)', text, re.IGNORECASE)
        
        # Extract description (text after "description" keyword)
        desc_match = re.search(r'description.*?is\s+(.+?)(?:\.|$)', text, re.IGNORECASE)
        
        if not all([contract_match, user_match, bounty_id_match, desc_match]):
            return None
            
        return BountyInfo(
            contract_address=contract_match.group(1),
            user_address=user_match.group(1),
            bounty_id=int(bounty_id_match.group(1)),
            description=desc_match.group(1).strip()
        )
    except Exception as e:
        print(f"Error parsing bounty info: {e}")
        return None

async def complete_bounty(bounty_info: BountyInfo) -> bool:
    """Make a tool call to complete the bounty."""
    try:
        url = "https://bounty-completion-server-739298578243.us-central1.run.app/complete-bounty"
        payload = {
            "contractAddress": bounty_info.contract_address,
            "userAddress": bounty_info.user_address,
            "bountyId": bounty_info.bounty_id
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Error completing bounty: {e}")
        return False

def create_bounty_verification_prompt(task_description: str, image_analysis: str) -> str:
    """Create a prompt to verify if the image matches the task description."""
    return f"""
You are a bounty verification assistant. Your task is to determine if a submitted image matches the required task description.

TASK DESCRIPTION: {task_description}

IMAGE ANALYSIS: {image_analysis}

Based on the task description and the image analysis, determine if the user has successfully completed the bounty task. 

Consider:
1. Does the image content match what was requested in the task?
2. Are the key elements of the task visible in the image?
3. Is the quality and content sufficient to verify task completion?

Respond with ONLY "TRUE" if the task is completed successfully, or "FALSE" if it is not completed or doesn't match the requirements.
Be strict in your evaluation - only return TRUE if you are confident the task has been properly completed.
"""

def create_chat_prompt(user_prompt: str, image_description: str = None) -> str:
    """Create a comprehensive prompt for the LLM."""
    if image_description and not image_description.startswith("Error"):
        prompt = f"""
You are a helpful AI assistant that can analyze images and answer questions.

USER PROMPT: {user_prompt}

IMAGE INFORMATION: {image_description}

Based on the image information provided, please analyze and describe what you can infer about the image content. 
Consider the technical details (dimensions, format, file size) and provide insights about what the image might contain.
If the user is asking specific questions about the image, use the technical information to provide educated responses.
If the user is asking general questions, answer them normally while considering the image context.

Be detailed, helpful, and engaging in your response. Make educated inferences about the image content based on the technical details.
"""
    else:
        prompt = f"""
You are a helpful AI assistant.

USER PROMPT: {user_prompt}

Please provide a helpful response to the user's question or request.
Be concise, helpful, and engaging in your response.
"""
    
    return prompt

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
    global llm_client
    llm_client = LLM(OPENAI_API_KEY)
    ctx.logger.info(f"Image Chatbot Agent started with address: {ctx.agent.address}")
    ctx.logger.info("Agent is ready to chat with images and text!")
    ctx.logger.info("🧠 Using OpenAI GPT-4o-mini for text reasoning")
    ctx.logger.info("👁️ Vision analysis enabled (GPT-4o Vision)")
    ctx.logger.info("🖼️ Image processing enabled")
    ctx.logger.info("🎯 Bounty verification system enabled")
    ctx.logger.info("REST API endpoints available:")
    ctx.logger.info("- POST http://localhost:8080/chat/image")
    ctx.logger.info("- POST http://localhost:8080/chat/text")
    ctx.logger.info("Message handlers available:")
    ctx.logger.info("- ChatMessage: Interactive chat with images and text")
    ctx.logger.info("- Bounty Verification: Automated task completion verification")

# Chat Protocol Handlers
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages and process image/text requests."""
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
            ctx.logger.info(f"Got a chat request from {sender}: {user_query}")
            
            try:
                # For now, handle text-only requests in chat
                # Image handling in chat would require additional message types
                prompt = create_chat_prompt(user_query)
                response_text = llm_client.create_completion(prompt)
                
                # Send the response back
                await ctx.send(sender, create_text_chat(response_text))
                
            except Exception as e:
                ctx.logger.error(f"Error processing chat request: {e}")
                await ctx.send(
                    sender, 
                    create_text_chat("I apologize, but I encountered an error processing your request. Please try again.")
                )
        else:
            ctx.logger.info(f"Got unexpected content from {sender}")

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle chat acknowledgements."""
    ctx.logger.info(f"Got an acknowledgement from {sender} for {msg.acknowledged_msg_id}")

# REST API Handlers
@agent.on_rest_post("/chat/image", ImageChatRequest, ImageChatResponse)
async def handle_image_chat(ctx: Context, req: ImageChatRequest) -> ImageChatResponse:
    """Handle image chat requests with text prompt."""
    ctx.logger.info(f"Received image chat request: {req.prompt[:50]}...")
    
    try:
        image_data = None
        
        # Process image if provided
        if req.image_data:
            ctx.logger.info("Processing base64 image data...")
            image_data = req.image_data
        elif req.image_url:
            ctx.logger.info(f"Processing image from URL: {req.image_url}")
            image_data, description = process_image_url(req.image_url)
            if image_data is None:
                return ImageChatResponse(
                    success=False,
                    response="",
                    error=description,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    agent_address=ctx.agent.address
                )
        
        # Check if this is a bounty verification request
        bounty_info = parse_bounty_info(req.prompt)
        
        if bounty_info and image_data:
            ctx.logger.info("Bounty verification request detected...")
            
            # First, analyze the image with vision
            image_analysis = llm_client.analyze_image_with_vision(image_data, f"Analyze this image in detail: {req.prompt}")
            
            # Create verification prompt
            verification_prompt = create_bounty_verification_prompt(bounty_info.description, image_analysis)
            
            # Get verification result
            verification_result = llm_client.create_completion(verification_prompt).strip().upper()
            
            ctx.logger.info(f"Verification result: {verification_result}")
            
            if verification_result == "TRUE":
                # Make the tool call to complete bounty
                success = await complete_bounty(bounty_info)
                if success:
                    response_text = "TRUE"
                    ctx.logger.info("Bounty completion API called successfully")
                else:
                    response_text = "FALSE"
                    ctx.logger.error("Failed to call bounty completion API")
            else:
                response_text = "FALSE"
                ctx.logger.info("Image does not match task requirements")
        
        elif image_data:
            ctx.logger.info("Analyzing image with vision model...")
            response_text = llm_client.analyze_image_with_vision(image_data, req.prompt)
        else:
            # Fallback to text-only if no image
            prompt = create_chat_prompt(req.prompt, None)
            response_text = llm_client.create_completion(prompt)
        
        return ImageChatResponse(
            success=True,
            response=response_text,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing image chat request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return ImageChatResponse(
            success=False,
            response="",
            error=error_msg,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

@agent.on_rest_post("/chat/text", ChatRequest, ChatResponse)
async def handle_text_chat(ctx: Context, req: ChatRequest) -> ChatResponse:
    """Handle text chat requests (with optional image)."""
    ctx.logger.info(f"Received text chat request: {req.message[:50]}...")
    
    try:
        image_data = None
        
        # Process image if provided
        if req.image_data:
            ctx.logger.info("Processing base64 image data...")
            image_data = req.image_data
        elif req.image_url:
            ctx.logger.info(f"Processing image from URL: {req.image_url}")
            image_data, description = process_image_url(req.image_url)
            if image_data is None:
                return ChatResponse(
                    success=False,
                    response="",
                    error=description,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    agent_address=ctx.agent.address
                )
        
        # Check if this is a bounty verification request
        bounty_info = parse_bounty_info(req.message)
        
        if bounty_info and image_data:
            ctx.logger.info("Bounty verification request detected...")
            
            # First, analyze the image with vision
            image_analysis = llm_client.analyze_image_with_vision(image_data, f"Analyze this image in detail: {req.message}")
            
            # Create verification prompt
            verification_prompt = create_bounty_verification_prompt(bounty_info.description, image_analysis)
            
            # Get verification result
            verification_result = llm_client.create_completion(verification_prompt).strip().upper()
            
            ctx.logger.info(f"Verification result: {verification_result}")
            
            if verification_result == "TRUE":
                # Make the tool call to complete bounty
                success = await complete_bounty(bounty_info)
                if success:
                    response_text = "TRUE"
                    ctx.logger.info("Bounty completion API called successfully")
                else:
                    response_text = "FALSE"
                    ctx.logger.error("Failed to call bounty completion API")
            else:
                response_text = "FALSE"
                ctx.logger.info("Image does not match task requirements")
        
        elif image_data:
            ctx.logger.info("Analyzing image with vision model...")
            response_text = llm_client.analyze_image_with_vision(image_data, req.message)
        else:
            # Fallback to text-only if no image
            prompt = create_chat_prompt(req.message, None)
            response_text = llm_client.create_completion(prompt)
        
        return ChatResponse(
            success=True,
            response=response_text,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )
        
    except Exception as e:
        error_msg = f"Error processing text chat request: {str(e)}"
        ctx.logger.error(error_msg)
        
        return ChatResponse(
            success=False,
            response="",
            error=error_msg,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_address=ctx.agent.address
        )

# Include the chat protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == '__main__':
    print("🚀 Starting Image Chatbot Agent...")
    print(f"✅ Agent address: {agent.address}")
    print("📡 Ready to chat with images and text")
    print("🧠 Powered by OpenAI GPT-4o-mini for text reasoning")
    print("👁️ Vision analysis enabled (GPT-4o Vision)")
    print("🖼️ Image processing enabled")
    print("🎯 Bounty verification system enabled")
    print(f"🔗 Image Chatbot Address: {agent.address}")
    print(f"🌐 Hosted Endpoint: https://imagechatbot-739298578243.us-central1.run.app/submit")
    print("\n🌐 REST API Endpoints:")
    print("POST http://localhost:8080/chat/image")
    print("Body: {\"prompt\": \"What do you see in this image?\", \"image_data\": \"base64_encoded_image\"}")
    print("POST http://localhost:8080/chat/text")
    print("Body: {\"message\": \"Hello, how are you?\", \"image_data\": \"base64_encoded_image\"}")
    print("\n🧪 Test queries:")
    print("- 'What do you see in this image?'")
    print("- 'Describe this image for me'")
    print("- 'Hello, how are you?'")
    print("\n🎯 Bounty Verification Example:")
    print("POST http://localhost:8080/chat/image")
    print("Body: {")
    print("  \"prompt\": \"The contract address of the business is 0xD62BeF70571b47fDe4b598d46aDaB2ff44851bE9, the user address is 0x2514844f312c02ae3c9d4feb40db4ec8830b6844, the bounty id is 1, and the description of the bounty is to take a video of an iphone unboxing\",")
    print("  \"image_data\": \"base64_encoded_image_of_task\"")
    print("}")
    print("Response: \"TRUE\" (if task completed and API call successful) or \"FALSE\" (if not)")
    print("\n📋 Usage Examples:")
    print("1. Text-only chat: Send message without image_data")
    print("2. Image + text: Send message with base64 encoded image_data")
    print("3. Image URL: Send message with image_url")
    print("4. Bounty verification: Send bounty details with task image")
    print("\nPress CTRL+C to stop the agent")
    
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Image Chatbot Agent...")
        print("✅ Agent stopped.")