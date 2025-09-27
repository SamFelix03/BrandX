from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import asyncio
from datetime import datetime
from hyperon import MeTTa, E, S, ValueAtom
import threading
import time
from typing import Dict, Optional
# from pyngrok import ngrok

# Set ngrok authtoken
# ngrok.set_auth_token("2kEGVmoK5L1A7fSTRJ6k4n7YMkl_3jBZXFdHfibFjz6fh9LAN")

app = FastAPI(title="Brand Research Orchestrator with Knowledge Graph", version="1.0.0")

class BrandRequest(BaseModel):
    brand_name: str

class OrchestratorResponse(BaseModel):
    brand_name: str
    web_search_result: str
    negative_reviews_result: str
    positive_reviews_result: str
    negative_reddit_result: str
    positive_reddit_result: str
    negative_social_result: str
    positive_social_result: str
    metrics_result: str
    bounty_result: str
    timestamp: str
    kg_storage_status: str


class BrandKnowledgeGraph:
    def __init__(self):
        self.metta = MeTTa()
        self.initialize_schema()
    
    def initialize_schema(self):
        """Initialize the knowledge graph schema for brand data."""
        # Brand relationships
        self.metta.space().add_atom(E(S("brand_has"), S("brand"), S("web_results")))
        self.metta.space().add_atom(E(S("brand_has"), S("brand"), S("reddit_threads")))
        self.metta.space().add_atom(E(S("brand_has"), S("brand"), S("reviews")))
        self.metta.space().add_atom(E(S("brand_has"), S("brand"), S("social_comments")))
        
        # Sentiment relationships
        self.metta.space().add_atom(E(S("has_sentiment"), S("reddit_threads"), S("positive")))
        self.metta.space().add_atom(E(S("has_sentiment"), S("reddit_threads"), S("negative")))
        self.metta.space().add_atom(E(S("has_sentiment"), S("reviews"), S("positive")))
        self.metta.space().add_atom(E(S("has_sentiment"), S("reviews"), S("negative")))
        self.metta.space().add_atom(E(S("has_sentiment"), S("social_comments"), S("positive")))
        self.metta.space().add_atom(E(S("has_sentiment"), S("social_comments"), S("negative")))
    
    def add_brand_data(self, brand_name, data):
        """Add comprehensive brand data to the knowledge graph."""
        brand_id = brand_name.lower().replace(" ", "_")
        
        # Add brand name
        self.metta.space().add_atom(E(S("brand_name"), S(brand_id), ValueAtom(brand_name)))
        
        # Add web results (single string)
        if 'web_results' in data and data['web_results']:
            self.metta.space().add_atom(E(S("web_result"), S(brand_id), ValueAtom(data['web_results'])))
            self.metta.space().add_atom(E(S("brand_has_web"), S(brand_id), S(brand_id)))
        
        # Add positive reddit threads (single string)
        if 'positive_reddit' in data and data['positive_reddit']:
            self.metta.space().add_atom(E(S("reddit_thread"), S(f"{brand_id}_pos"), ValueAtom(data['positive_reddit'])))
            self.metta.space().add_atom(E(S("brand_has_reddit"), S(brand_id), S(f"{brand_id}_pos")))
            self.metta.space().add_atom(E(S("thread_sentiment"), S(f"{brand_id}_pos"), S("positive")))
        
        # Add negative reddit threads (single string)
        if 'negative_reddit' in data and data['negative_reddit']:
            self.metta.space().add_atom(E(S("reddit_thread"), S(f"{brand_id}_neg"), ValueAtom(data['negative_reddit'])))
            self.metta.space().add_atom(E(S("brand_has_reddit"), S(brand_id), S(f"{brand_id}_neg")))
            self.metta.space().add_atom(E(S("thread_sentiment"), S(f"{brand_id}_neg"), S("negative")))
        
        # Add positive reviews (single string)
        if 'positive_reviews' in data and data['positive_reviews']:
            self.metta.space().add_atom(E(S("review"), S(f"{brand_id}_pos"), ValueAtom(data['positive_reviews'])))
            self.metta.space().add_atom(E(S("brand_has_review"), S(brand_id), S(f"{brand_id}_pos")))
            self.metta.space().add_atom(E(S("review_sentiment"), S(f"{brand_id}_pos"), S("positive")))
        
        # Add negative reviews (single string)
        if 'negative_reviews' in data and data['negative_reviews']:
            self.metta.space().add_atom(E(S("review"), S(f"{brand_id}_neg"), ValueAtom(data['negative_reviews'])))
            self.metta.space().add_atom(E(S("brand_has_review"), S(brand_id), S(f"{brand_id}_neg")))
            self.metta.space().add_atom(E(S("review_sentiment"), S(f"{brand_id}_neg"), S("negative")))
        
        # Add positive social comments (single string)
        if 'positive_social' in data and data['positive_social']:
            self.metta.space().add_atom(E(S("social_comment"), S(f"{brand_id}_pos"), ValueAtom(data['positive_social'])))
            self.metta.space().add_atom(E(S("brand_has_social"), S(brand_id), S(f"{brand_id}_pos")))
            self.metta.space().add_atom(E(S("comment_sentiment"), S(f"{brand_id}_pos"), S("positive")))
        
        # Add negative social comments (single string)
        if 'negative_social' in data and data['negative_social']:
            self.metta.space().add_atom(E(S("social_comment"), S(f"{brand_id}_neg"), ValueAtom(data['negative_social'])))
            self.metta.space().add_atom(E(S("brand_has_social"), S(brand_id), S(f"{brand_id}_neg")))
            self.metta.space().add_atom(E(S("comment_sentiment"), S(f"{brand_id}_neg"), S("negative")))
        
        return f"Successfully added data for brand: {brand_name}"
    
    def query_brand_data(self, brand_name, data_type=None, sentiment=None):
        """Query brand data from the knowledge graph."""
        brand_id = brand_name.lower().replace(" ", "_")
        results = []
        
        if data_type == 'web_results':
            query_str = f'!(match &self (web_result {brand_id} $content) $content)'
            web_results = self.metta.run(query_str)
            if web_results and web_results[0]:
                results.append(web_results[0][0].get_object().value)
        
        elif data_type == 'reddit_threads':
            if sentiment:
                query_str = f'!(match &self (reddit_thread {brand_id}_{sentiment[:3]} $content) $content)'
            else:
                query_str = f'!(match &self (reddit_thread {brand_id}_pos $content) $content)'
                pos_results = self.metta.run(query_str)
                if pos_results and pos_results[0]:
                    results.append(pos_results[0][0].get_object().value)
                
                query_str = f'!(match &self (reddit_thread {brand_id}_neg $content) $content)'
                neg_results = self.metta.run(query_str)
                if neg_results and neg_results[0]:
                    results.append(neg_results[0][0].get_object().value)
                return results
            
            thread_results = self.metta.run(query_str)
            if thread_results and thread_results[0]:
                results.append(thread_results[0][0].get_object().value)
        
        elif data_type == 'reviews':
            if sentiment:
                query_str = f'!(match &self (review {brand_id}_{sentiment[:3]} $content) $content)'
            else:
                query_str = f'!(match &self (review {brand_id}_pos $content) $content)'
                pos_results = self.metta.run(query_str)
                if pos_results and pos_results[0]:
                    results.append(pos_results[0][0].get_object().value)
                
                query_str = f'!(match &self (review {brand_id}_neg $content) $content)'
                neg_results = self.metta.run(query_str)
                if neg_results and neg_results[0]:
                    results.append(neg_results[0][0].get_object().value)
                return results
            
            review_results = self.metta.run(query_str)
            if review_results and review_results[0]:
                results.append(review_results[0][0].get_object().value)
        
        elif data_type == 'social_comments':
            if sentiment:
                query_str = f'!(match &self (social_comment {brand_id}_{sentiment[:3]} $content) $content)'
            else:
                query_str = f'!(match &self (social_comment {brand_id}_pos $content) $content)'
                pos_results = self.metta.run(query_str)
                if pos_results and pos_results[0]:
                    results.append(pos_results[0][0].get_object().value)
                
                query_str = f'!(match &self (social_comment {brand_id}_neg $content) $content)'
                neg_results = self.metta.run(query_str)
                if neg_results and neg_results[0]:
                    results.append(neg_results[0][0].get_object().value)
                return results
            
            comment_results = self.metta.run(query_str)
            if comment_results and comment_results[0]:
                results.append(comment_results[0][0].get_object().value)
        
        return results
    
    def get_all_brands(self):
        """Get all brands in the knowledge graph."""
        query_str = '!(match &self (brand_name $brand_id $name) $name)'
        results = self.metta.run(query_str)
        return [result[0].get_object().value for result in results if result and len(result) > 0]
    
    def get_brand_summary(self, brand_name):
        """Get a comprehensive summary of all data for a brand."""
        brand_id = brand_name.lower().replace(" ", "_")
        
        summary = {
            'brand_name': brand_name,
            'web_results': self.query_brand_data(brand_name, 'web_results'),
            'positive_reddit': self.query_brand_data(brand_name, 'reddit_threads', 'positive'),
            'negative_reddit': self.query_brand_data(brand_name, 'reddit_threads', 'negative'),
            'positive_reviews': self.query_brand_data(brand_name, 'reviews', 'positive'),
            'negative_reviews': self.query_brand_data(brand_name, 'reviews', 'negative'),
            'positive_social': self.query_brand_data(brand_name, 'social_comments', 'positive'),
            'negative_social': self.query_brand_data(brand_name, 'social_comments', 'negative')
        }
        
        return summary

# Initialize the knowledge graph service
kg_service = BrandKnowledgeGraph()

# Global status tracking
global_status = {
    "is_processing": False,
    "brand_name": None,
    "progress": "Ready",
    "result": None,
    "error_message": None,
    "timestamp": None
}

async def process_brand_research(brand_name: str):
    """Background task to process brand research"""
    try:
        # Update global status to processing
        global_status["is_processing"] = True
        global_status["brand_name"] = brand_name
        global_status["progress"] = "Starting brand analysis..."
        global_status["timestamp"] = datetime.now().isoformat()
        global_status["result"] = None
        global_status["error_message"] = None
        
        print(f"🚀 Starting background brand analysis for: {brand_name}")
        print(f"🔄 Background task is running independently...")
        
        async with httpx.AsyncClient(timeout=None) as client:
            
            # === 1. WEB SEARCH AGENT ===
            global_status["progress"] = "Step 1: Web Search Agent..."
            print(f"\n🔍 Step 1: Calling Web Search Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 1 started")
            web_search_response = await client.post(
                "https://websearchagent-739298578243.us-central1.run.app/research/brand",
                json={"brand_name": brand_name}
            )
            web_search_response.raise_for_status()
            web_search_data = web_search_response.json()
            
            # Check if we got the final result immediately
            if web_search_data.get("success") and "research_result" in web_search_data:
                web_search_result = web_search_data["research_result"]
            else:
                # The agent is still processing, we need to poll for results
                print(f"Web search agent is processing... Status: {web_search_data.get('status', 'unknown')}")
                
                # Poll for results indefinitely until we get a result
                poll_interval = 4
                attempt = 0
                
                while True:
                    attempt += 1
                    print(f"Web search polling attempt {attempt}")
                    await asyncio.sleep(poll_interval)
                    
                    # Make another request to check status
                    poll_response = await client.post(
                        "https://websearchagent-739298578243.us-central1.run.app/research/brand",
                        json={"brand_name": brand_name}
                    )
                    poll_response.raise_for_status()
                    poll_data = poll_response.json()
                    
                    # Check if research is complete
                    if poll_data.get("success") and "research_result" in poll_data:
                        web_search_result = poll_data["research_result"]
                        print(f"✅ Web search completed after {attempt} polling attempts!")
                        break
                    elif poll_data.get("status") == "error":
                        raise HTTPException(status_code=500, detail="Web search agent encountered an error")
                    else:
                        print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
            
            # === 2. NEGATIVE REVIEWS AGENT ===
            global_status["progress"] = "Step 2: Negative Reviews Agent..."
            print(f"\n👎 Step 2: Calling Negative Reviews Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 2 started")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Negative reviews attempt {attempt}")
                    negative_reviews_response = await client.post(
                        "https://negativereviewsagent-739298578243.us-central1.run.app/reviews/negative",
                        json={"brand_name": brand_name}
                    )
                    negative_reviews_response.raise_for_status()
                    negative_reviews_data = negative_reviews_response.json()
                    
                    # Check if we got the final result immediately
                    if negative_reviews_data.get("success") and "reviews_result" in negative_reviews_data:
                        # Check if the result contains an error message
                        if "error" in negative_reviews_data["reviews_result"].lower() or "500" in negative_reviews_data["reviews_result"]:
                            print(f"❌ Negative reviews returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        negative_reviews_result = negative_reviews_data["reviews_result"]
                        print(f"✅ Negative reviews completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Negative reviews agent is processing... Status: {negative_reviews_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Negative reviews polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://negativereviewsagent-739298578243.us-central1.run.app/reviews/negative",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "reviews_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["reviews_result"].lower() or "500" in poll_data["reviews_result"]:
                                    print(f"❌ Negative reviews polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                negative_reviews_result = poll_data["reviews_result"]
                                print(f"✅ Negative reviews completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Negative reviews agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'negative_reviews_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Negative reviews request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== NEGATIVE REVIEWS RESULT FOR {brand_name.upper()} ===")
            print(negative_reviews_result)
            print("=" * 50)
            
            # === 3. POSITIVE REVIEWS AGENT ===
            global_status["progress"] = "Step 3: Positive Reviews Agent..."
            print(f"\n👍 Step 3: Calling Positive Reviews Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 3 started")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Positive reviews attempt {attempt}")
                    positive_reviews_response = await client.post(
                        "https://positivereviewsagent-739298578243.us-central1.run.app/reviews/positive",
                        json={"brand_name": brand_name}
                    )
                    positive_reviews_response.raise_for_status()
                    positive_reviews_data = positive_reviews_response.json()
                    
                    # Check if we got the final result immediately
                    if positive_reviews_data.get("success") and "reviews_result" in positive_reviews_data:
                        # Check if the result contains an error message
                        if "error" in positive_reviews_data["reviews_result"].lower() or "500" in positive_reviews_data["reviews_result"]:
                            print(f"❌ Positive reviews returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        positive_reviews_result = positive_reviews_data["reviews_result"]
                        print(f"✅ Positive reviews completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Positive reviews agent is processing... Status: {positive_reviews_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Positive reviews polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://positivereviewsagent-739298578243.us-central1.run.app/reviews/positive",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "reviews_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["reviews_result"].lower() or "500" in poll_data["reviews_result"]:
                                    print(f"❌ Positive reviews polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                positive_reviews_result = poll_data["reviews_result"]
                                print(f"✅ Positive reviews completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Positive reviews agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'positive_reviews_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Positive reviews request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== POSITIVE REVIEWS RESULT FOR {brand_name.upper()} ===")
            print(positive_reviews_result)
            print("=" * 50)
            
            # === 4. NEGATIVE REDDIT AGENT ===
            global_status["progress"] = "Step 4: Negative Reddit Agent..."
            print(f"\n📱👎 Step 4: Calling Negative Reddit Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 4 started")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Negative reddit attempt {attempt}")
                    negative_reddit_response = await client.post(
                        "https://redditnegativeagent-739298578243.us-central1.run.app/reddit/negative",
                        json={"product_name": brand_name}
                    )
                    negative_reddit_response.raise_for_status()
                    negative_reddit_data = negative_reddit_response.json()
                    
                    if negative_reddit_data.get("success") and "reddit_result" in negative_reddit_data:
                        if "error" in negative_reddit_data["reddit_result"].lower() or "500" in negative_reddit_data["reddit_result"]:
                            print(f"❌ Negative reddit returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        negative_reddit_result = negative_reddit_data["reddit_result"]
                        print(f"✅ Negative reddit completed successfully after {attempt} attempts!")
                        break
                    else:
                        print(f"Negative reddit agent is processing... Status: {negative_reddit_data.get('status', 'unknown')}")
                        await asyncio.sleep(4)
                        continue
                        
                except Exception as e:
                    print(f"❌ Negative reddit request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== NEGATIVE REDDIT RESULT FOR {brand_name.upper()} ===")
            print(negative_reddit_result)
            print("=" * 50)
            # === 5. POSITIVE REDDIT AGENT ===
            global_status["progress"] = "Step 5: Positive Reddit Agent..."
            print(f"\n📱👍 Step 5: Calling Positive Reddit Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 5 started")
            
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Positive reddit attempt {attempt}")
                    positive_reddit_response = await client.post(
                        "https://redditpositiveagent-739298578243.us-central1.run.app/reddit/positive",
                        json={"product_name": brand_name}
                    )
                    positive_reddit_response.raise_for_status()
                    positive_reddit_data = positive_reddit_response.json()
                    
                    if positive_reddit_data.get("success") and "reddit_result" in positive_reddit_data:
                        if "error" in positive_reddit_data["reddit_result"].lower() or "500" in positive_reddit_data["reddit_result"]:
                            print(f"❌ Positive reddit returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        positive_reddit_result = positive_reddit_data["reddit_result"]
                        print(f"✅ Positive reddit completed successfully after {attempt} attempts!")
                        break
                    else:
                        print(f"Positive reddit agent is processing... Status: {positive_reddit_data.get('status', 'unknown')}")
                        await asyncio.sleep(4)
                        continue
                        
                except Exception as e:
                    print(f"❌ Positive reddit request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== POSITIVE REDDIT RESULT FOR {brand_name.upper()} ===")
            print(positive_reddit_result)
            print("=" * 50)
            
            # === 6. NEGATIVE SOCIAL AGENT ===
            global_status["progress"] = "Step 6: Negative Social Agent..."
            print(f"\n📱👎 Step 6: Calling Negative Social Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 6 started")
            
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Negative social attempt {attempt}")
                    negative_social_response = await client.post(
                        "https://negativesocialsagent-739298578243.us-central1.run.app/social/negative",
                        json={"brand_name": brand_name}
                    )
                    negative_social_response.raise_for_status()
                    negative_social_data = negative_social_response.json()
                    
                    if negative_social_data.get("success") and "social_media_result" in negative_social_data:
                        if "error" in negative_social_data["social_media_result"].lower() or "500" in negative_social_data["social_media_result"]:
                            print(f"❌ Negative social returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        negative_social_result = negative_social_data["social_media_result"]
                        print(f"✅ Negative social completed successfully after {attempt} attempts!")
                        break
                    else:
                        print(f"Negative social agent is processing... Status: {negative_social_data.get('status', 'unknown')}")
                        await asyncio.sleep(4)
                        continue
                        
                except Exception as e:
                    print(f"❌ Negative social request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== NEGATIVE SOCIAL RESULT FOR {brand_name.upper()} ===")
            print(negative_social_result)
            print("=" * 50)
            
            # === 7. POSITIVE SOCIAL AGENT ===
            global_status["progress"] = "Step 7: Positive Social Agent..."
            print(f"\n📱👍 Step 7: Calling Positive Social Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 7 started")
            
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Positive social attempt {attempt}")
                    positive_social_response = await client.post(
                        "https://positivesocialsagent-739298578243.us-central1.run.app/social/positive",
                        json={"brand_name": brand_name}
                    )
                    positive_social_response.raise_for_status()
                    positive_social_data = positive_social_response.json()
                    
                    if positive_social_data.get("success") and "social_media_result" in positive_social_data:
                        if "error" in positive_social_data["social_media_result"].lower() or "500" in positive_social_data["social_media_result"]:
                            print(f"❌ Positive social returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        positive_social_result = positive_social_data["social_media_result"]
                        print(f"✅ Positive social completed successfully after {attempt} attempts!")
                        break
                    else:
                        print(f"Positive social agent is processing... Status: {positive_social_data.get('status', 'unknown')}")
                        await asyncio.sleep(4)
                        continue
                        
                except Exception as e:
                    print(f"❌ Positive social request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== POSITIVE SOCIAL RESULT FOR {brand_name.upper()} ===")
            print(positive_social_result)
            print("=" * 50)
            
            print(f"\n🎉 ALL ANALYSIS COMPLETE FOR {brand_name.upper()}!")
            
            # === STORE RESULTS IN KNOWLEDGE GRAPH ===
            global_status["progress"] = "Storing results in Knowledge Graph..."
            print(f"\n🗄️ Storing results in Knowledge Graph for {brand_name}...")
            try:
                brand_data = {
                    "web_results": web_search_result,
                    "positive_reddit": positive_reddit_result,
                    "negative_reddit": negative_reddit_result,
                    "positive_reviews": positive_reviews_result,
                    "negative_reviews": negative_reviews_result,
                    "positive_social": positive_social_result,
                    "negative_social": negative_social_result
                }
                
                kg_result = kg_service.add_brand_data(brand_name, brand_data)
                print(f"✅ Knowledge Graph storage successful: {kg_result}")
                kg_storage_status = "Successfully stored in Knowledge Graph"
                
            except Exception as e:
                print(f"❌ Knowledge Graph storage failed: {e}")
                kg_storage_status = f"Knowledge Graph storage failed: {str(e)}"
            
            # === 8. METRICS AGENT ===
            global_status["progress"] = "Step 8: Metrics Agent..."
            print(f"\n📊 Step 8: Calling Metrics Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 8 started")
            
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Metrics agent attempt {attempt}")
                    metrics_response = await client.post(
                        "https://metricsagent-739298578243.us-central1.run.app/brand/metrics",
                        json={"brand_name": brand_name}
                    )
                    metrics_response.raise_for_status()
                    metrics_data = metrics_response.json()
                    
                    if metrics_data.get("success") and "metrics" in metrics_data:
                        if "error" in str(metrics_data).lower() or "500" in str(metrics_data):
                            print(f"❌ Metrics agent returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        metrics_result = str(metrics_data)
                        print(f"✅ Metrics agent completed successfully after {attempt} attempts!")
                        break
                    else:
                        print(f"Metrics agent is processing... Status: {metrics_data.get('status', 'unknown')}")
                        await asyncio.sleep(4)
                        continue
                        
                except Exception as e:
                    print(f"❌ Metrics agent request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            print(f"\n=== METRICS RESULT FOR {brand_name.upper()} ===")
            print(metrics_result)
            print("=" * 50)
            
            # === 9. BOUNTY AGENT (with 1 minute delay) ===
            global_status["progress"] = "Step 9: Waiting before Bounty Agent..."
            print(f"\n🎯 Step 9: Waiting 2.5 minutes before calling Bounty Agent for {brand_name}...")
            await asyncio.sleep(150)  # Wait for 2.5 minutes
            
            global_status["progress"] = "Step 9: Bounty Agent..."
            print(f"\n🎯 Calling Bounty Agent for {brand_name}...")
            print(f"🔄 Background task continuing - Step 9 started")
            
            # Simple retry logic: get bounty data or retry (max 50 attempts)
            attempt = 0
            max_attempts = 50
            bounty_result = None
            
            while attempt < max_attempts and bounty_result is None:
                attempt += 1
                try:
                    print(f"Bounty agent attempt {attempt}/{max_attempts}")
                    bounty_response = await client.get(
                        "https://bountyagent-739298578243.us-central1.run.app/bounties/auto-generated"
                    )
                    bounty_response.raise_for_status()
                    bounty_data = bounty_response.json()
                    
                    if bounty_data.get("success") and bounty_data.get("auto_generated_bounties"):
                        bounty_result = str(bounty_data)
                        print(f"✅ Bounty agent completed successfully after {attempt} attempts!")
                        break
                    else:
                        print(f"❌ Bounty agent not ready yet, retrying in 4 seconds...")
                        await asyncio.sleep(4)
                        
                except Exception as e:
                    print(f"❌ Bounty agent request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
            
            # If we still don't have bounty data after max attempts, use empty result
            if bounty_result is None:
                print(f"❌ Bounty agent failed after {max_attempts} attempts, using empty result")
                bounty_result = '{"success": false, "error": "Max attempts exceeded", "auto_generated_bounties": {}}'
            
            print(f"\n=== BOUNTY RESULT FOR {brand_name.upper()} ===")
            print(bounty_result)
            print("=" * 50)
            
            print(f"\n🎉 ALL STEPS COMPLETED! Preparing final response...")
            
            response = OrchestratorResponse(
                brand_name=brand_name,
                web_search_result=web_search_result,
                negative_reviews_result=negative_reviews_result,
                positive_reviews_result=positive_reviews_result,
                negative_reddit_result=negative_reddit_result,
                positive_reddit_result=positive_reddit_result,
                negative_social_result=negative_social_result,
                positive_social_result=positive_social_result,
                metrics_result=metrics_result,
                bounty_result=bounty_result,
                timestamp=datetime.now().isoformat(),
                kg_storage_status=kg_storage_status
            )
        
        # Update global status to completed
        global_status["is_processing"] = False
        global_status["progress"] = "All analysis completed successfully!"
        global_status["result"] = response
        global_status["timestamp"] = datetime.now().isoformat()
        
    except Exception as e:
        print(f"❌ Background processing failed: {e}")
        global_status["is_processing"] = False
        global_status["error_message"] = str(e)
        global_status["timestamp"] = datetime.now().isoformat()

@app.post("/research-brand")
async def research_brand(request: BrandRequest):
    """
    Start brand research and return immediately with status
    """
    brand_name = request.brand_name
    
    # Check if already processing
    if global_status["is_processing"]:
        return {
            "status": "processing",
            "brand_name": global_status["brand_name"],
            "progress": global_status["progress"],
            "timestamp": global_status["timestamp"]
        }
    
    # Start background task using asyncio to ensure proper isolation
    asyncio.create_task(process_brand_research(brand_name))
    
    # Return immediately with processing status
    return {
        "status": "processing",
        "brand_name": brand_name,
        "progress": "Initializing brand research...",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/research-status")
async def get_research_status():
    """
    Get the current status of brand research
    """
    print(f"📊 Status check - is_processing: {global_status['is_processing']}, progress: {global_status['progress']}")
    
    if global_status["is_processing"]:
        return {
            "status": "processing",
            "brand_name": global_status["brand_name"],
            "progress": global_status["progress"],
            "timestamp": global_status["timestamp"]
        }
    elif global_status["result"]:
        print(f"✅ Returning completed results for {global_status['brand_name']}")
        return global_status["result"]
    elif global_status["error_message"]:
        return {
            "status": "error",
            "error_message": global_status["error_message"],
            "timestamp": global_status["timestamp"]
        }
    else:
        return {
            "status": "ready",
            "message": "No research in progress",
            "timestamp": datetime.now().isoformat()
        }

@app.post("/research-brand-sync", response_model=OrchestratorResponse)
async def research_brand_sync(request: BrandRequest):
    """
    Original synchronous endpoint for backward compatibility
    """
    brand_name = request.brand_name
    
    try:
        print(f"Starting brand analysis for: {brand_name}")
        
        async with httpx.AsyncClient(timeout=None) as client:
            
            # === 1. WEB SEARCH AGENT ===
            print(f"\n🔍 Step 1: Calling Web Search Agent for {brand_name}...")
            web_search_response = await client.post(
                "https://websearchagent-739298578243.us-central1.run.app/research/brand",
                json={"brand_name": brand_name}
            )
            web_search_response.raise_for_status()
            web_search_data = web_search_response.json()
            
            # Check if we got the final result immediately
            if web_search_data.get("success") and "research_result" in web_search_data:
                web_search_result = web_search_data["research_result"]
            else:
                # The agent is still processing, we need to poll for results
                print(f"Web search agent is processing... Status: {web_search_data.get('status', 'unknown')}")
                
                # Poll for results indefinitely until we get a result
                poll_interval = 4
                attempt = 0
                
                while True:
                    attempt += 1
                    print(f"Web search polling attempt {attempt}")
                    await asyncio.sleep(poll_interval)
                    
                    # Make another request to check status
                    poll_response = await client.post(
                        "https://websearchagent-739298578243.us-central1.run.app/research/brand",
                        json={"brand_name": brand_name}
                    )
                    poll_response.raise_for_status()
                    poll_data = poll_response.json()
                    
                    # Check if research is complete
                    if poll_data.get("success") and "research_result" in poll_data:
                        web_search_result = poll_data["research_result"]
                        print(f"✅ Web search completed after {attempt} polling attempts!")
                        break
                    elif poll_data.get("status") == "error":
                        raise HTTPException(status_code=500, detail="Web search agent encountered an error")
                    else:
                        print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
            
            # Print the web search result
            print(f"\n=== WEB SEARCH RESULT FOR {brand_name.upper()} ===")
            print(web_search_result)
            print("=" * 50)
            
            # === 2. NEGATIVE REVIEWS AGENT ===
            print(f"\n👎 Step 2: Calling Negative Reviews Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Negative reviews attempt {attempt}")
                    negative_reviews_response = await client.post(
                        "https://negativereviewsagent-739298578243.us-central1.run.app/reviews/negative",
                        json={"brand_name": brand_name}
                    )
                    negative_reviews_response.raise_for_status()
                    negative_reviews_data = negative_reviews_response.json()
                    
                    # Check if we got the final result immediately
                    if negative_reviews_data.get("success") and "reviews_result" in negative_reviews_data:
                        # Check if the result contains an error message
                        if "error" in negative_reviews_data["reviews_result"].lower() or "500" in negative_reviews_data["reviews_result"]:
                            print(f"❌ Negative reviews returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        negative_reviews_result = negative_reviews_data["reviews_result"]
                        print(f"✅ Negative reviews completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Negative reviews agent is processing... Status: {negative_reviews_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Negative reviews polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://negativereviewsagent-739298578243.us-central1.run.app/reviews/negative",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "reviews_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["reviews_result"].lower() or "500" in poll_data["reviews_result"]:
                                    print(f"❌ Negative reviews polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                negative_reviews_result = poll_data["reviews_result"]
                                print(f"✅ Negative reviews completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Negative reviews agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'negative_reviews_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Negative reviews request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the negative reviews result
            print(f"\n=== NEGATIVE REVIEWS RESULT FOR {brand_name.upper()} ===")
            print(negative_reviews_result)
            print("=" * 50)
            
            # === 3. POSITIVE REVIEWS AGENT ===
            print(f"\n👍 Step 3: Calling Positive Reviews Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Positive reviews attempt {attempt}")
                    positive_reviews_response = await client.post(
                        "https://positivereviewsagent-739298578243.us-central1.run.app/reviews/positive",
                        json={"brand_name": brand_name}
                    )
                    positive_reviews_response.raise_for_status()
                    positive_reviews_data = positive_reviews_response.json()
                    
                    # Check if we got the final result immediately
                    if positive_reviews_data.get("success") and "reviews_result" in positive_reviews_data:
                        # Check if the result contains an error message
                        if "error" in positive_reviews_data["reviews_result"].lower() or "500" in positive_reviews_data["reviews_result"]:
                            print(f"❌ Positive reviews returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        positive_reviews_result = positive_reviews_data["reviews_result"]
                        print(f"✅ Positive reviews completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Positive reviews agent is processing... Status: {positive_reviews_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Positive reviews polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://positivereviewsagent-739298578243.us-central1.run.app/reviews/positive",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "reviews_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["reviews_result"].lower() or "500" in poll_data["reviews_result"]:
                                    print(f"❌ Positive reviews polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                positive_reviews_result = poll_data["reviews_result"]
                                print(f"✅ Positive reviews completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Positive reviews agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'positive_reviews_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Positive reviews request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the positive reviews result
            print(f"\n=== POSITIVE REVIEWS RESULT FOR {brand_name.upper()} ===")
            print(positive_reviews_result)
            print("=" * 50)
            
            # === 4. NEGATIVE REDDIT AGENT ===
            print(f"\n📱👎 Step 4: Calling Negative Reddit Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Negative reddit attempt {attempt}")
                    negative_reddit_response = await client.post(
                        "https://redditnegativeagent-739298578243.us-central1.run.app/reddit/negative",
                        json={"product_name": brand_name}
                    )
                    negative_reddit_response.raise_for_status()
                    negative_reddit_data = negative_reddit_response.json()
                    
                    # Check if we got the final result immediately
                    if negative_reddit_data.get("success") and "reddit_result" in negative_reddit_data:
                        # Check if the result contains an error message
                        if "error" in negative_reddit_data["reddit_result"].lower() or "500" in negative_reddit_data["reddit_result"]:
                            print(f"❌ Negative reddit returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        negative_reddit_result = negative_reddit_data["reddit_result"]
                        print(f"✅ Negative reddit completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Negative reddit agent is processing... Status: {negative_reddit_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Negative reddit polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://redditnegativeagent-739298578243.us-central1.run.app/reddit/negative",
                                json={"product_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "reddit_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["reddit_result"].lower() or "500" in poll_data["reddit_result"]:
                                    print(f"❌ Negative reddit polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                negative_reddit_result = poll_data["reddit_result"]
                                print(f"✅ Negative reddit completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Negative reddit agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'negative_reddit_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Negative reddit request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the negative reddit result
            print(f"\n=== NEGATIVE REDDIT RESULT FOR {brand_name.upper()} ===")
            print(negative_reddit_result)
            print("=" * 50)
            
            # === 5. POSITIVE REDDIT AGENT ===
            print(f"\n📱👍 Step 5: Calling Positive Reddit Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Positive reddit attempt {attempt}")
                    positive_reddit_response = await client.post(
                        "https://redditpositiveagent-739298578243.us-central1.run.app/reddit/positive",
                        json={"product_name": brand_name}
                    )
                    positive_reddit_response.raise_for_status()
                    positive_reddit_data = positive_reddit_response.json()
                    
                    # Check if we got the final result immediately
                    if positive_reddit_data.get("success") and "reddit_result" in positive_reddit_data:
                        # Check if the result contains an error message
                        if "error" in positive_reddit_data["reddit_result"].lower() or "500" in positive_reddit_data["reddit_result"]:
                            print(f"❌ Positive reddit returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        positive_reddit_result = positive_reddit_data["reddit_result"]
                        print(f"✅ Positive reddit completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Positive reddit agent is processing... Status: {positive_reddit_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Positive reddit polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://redditpositiveagent-739298578243.us-central1.run.app/reddit/positive",
                                json={"product_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "reddit_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["reddit_result"].lower() or "500" in poll_data["reddit_result"]:
                                    print(f"❌ Positive reddit polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                positive_reddit_result = poll_data["reddit_result"]
                                print(f"✅ Positive reddit completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Positive reddit agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'positive_reddit_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Positive reddit request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the positive reddit result
            print(f"\n=== POSITIVE REDDIT RESULT FOR {brand_name.upper()} ===")
            print(positive_reddit_result)
            print("=" * 50)
            
            # === 6. NEGATIVE SOCIAL AGENT ===
            print(f"\n📱👎 Step 6: Calling Negative Social Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Negative social attempt {attempt}")
                    negative_social_response = await client.post(
                        "https://negativesocialsagent-739298578243.us-central1.run.app/social/negative",
                        json={"brand_name": brand_name}
                    )
                    negative_social_response.raise_for_status()
                    negative_social_data = negative_social_response.json()
                    
                    # Check if we got the final result immediately
                    if negative_social_data.get("success") and "social_media_result" in negative_social_data:
                        # Check if the result contains an error message
                        if "error" in negative_social_data["social_media_result"].lower() or "500" in negative_social_data["social_media_result"]:
                            print(f"❌ Negative social returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        negative_social_result = negative_social_data["social_media_result"]
                        print(f"✅ Negative social completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Negative social agent is processing... Status: {negative_social_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Negative social polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://negativesocialsagent-739298578243.us-central1.run.app/social/negative",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "social_media_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["social_media_result"].lower() or "500" in poll_data["social_media_result"]:
                                    print(f"❌ Negative social polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                negative_social_result = poll_data["social_media_result"]
                                print(f"✅ Negative social completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Negative social agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'negative_social_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Negative social request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the negative social result
            print(f"\n=== NEGATIVE SOCIAL RESULT FOR {brand_name.upper()} ===")
            print(negative_social_result)
            print("=" * 50)
            
            # === 7. POSITIVE SOCIAL AGENT ===
            print(f"\n📱👍 Step 7: Calling Positive Social Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Positive social attempt {attempt}")
                    positive_social_response = await client.post(
                        "https://positivesocialsagent-739298578243.us-central1.run.app/social/positive",
                        json={"brand_name": brand_name}
                    )
                    positive_social_response.raise_for_status()
                    positive_social_data = positive_social_response.json()
                    
                    # Check if we got the final result immediately
                    if positive_social_data.get("success") and "social_media_result" in positive_social_data:
                        # Check if the result contains an error message
                        if "error" in positive_social_data["social_media_result"].lower() or "500" in positive_social_data["social_media_result"]:
                            print(f"❌ Positive social returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        positive_social_result = positive_social_data["social_media_result"]
                        print(f"✅ Positive social completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Positive social agent is processing... Status: {positive_social_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Positive social polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://positivesocialsagent-739298578243.us-central1.run.app/social/positive",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "social_media_result" in poll_data:
                                # Check if the result contains an error message
                                if "error" in poll_data["social_media_result"].lower() or "500" in poll_data["social_media_result"]:
                                    print(f"❌ Positive social polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                positive_social_result = poll_data["social_media_result"]
                                print(f"✅ Positive social completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Positive social agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'positive_social_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Positive social request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the positive social result
            print(f"\n=== POSITIVE SOCIAL RESULT FOR {brand_name.upper()} ===")
            print(positive_social_result)
            print("=" * 50)
            
            print(f"\n🎉 ALL ANALYSIS COMPLETE FOR {brand_name.upper()}!")
            
            # === STORE RESULTS IN KNOWLEDGE GRAPH ===
            print(f"\n🗄️ Storing results in Knowledge Graph for {brand_name}...")
            try:
                brand_data = {
                    "web_results": web_search_result,
                    "positive_reddit": positive_reddit_result,
                    "negative_reddit": negative_reddit_result,
                    "positive_reviews": positive_reviews_result,
                    "negative_reviews": negative_reviews_result,
                    "positive_social": positive_social_result,
                    "negative_social": negative_social_result
                }
                
                kg_result = kg_service.add_brand_data(brand_name, brand_data)
                print(f"✅ Knowledge Graph storage successful: {kg_result}")
                kg_storage_status = "Successfully stored in Knowledge Graph"
                
            except Exception as e:
                print(f"❌ Knowledge Graph storage failed: {e}")
                kg_storage_status = f"Knowledge Graph storage failed: {str(e)}"
            
            # === 8. METRICS AGENT ===
            print(f"\n📊 Step 8: Calling Metrics Agent for {brand_name}...")
            
            # Keep retrying until we get a successful response
            attempt = 0
            while True:
                attempt += 1
                try:
                    print(f"Metrics agent attempt {attempt}")
                    metrics_response = await client.post(
                        "https://metricsagent-739298578243.us-central1.run.app/brand/metrics",
                        json={"brand_name": brand_name}
                    )
                    metrics_response.raise_for_status()
                    metrics_data = metrics_response.json()
                    
                    # Check if we got the final result immediately
                    if metrics_data.get("success") and "metrics" in metrics_data:
                        # Check if the result contains an error message
                        if "error" in str(metrics_data).lower() or "500" in str(metrics_data):
                            print(f"❌ Metrics agent returned error result, retrying in 4 seconds...")
                            await asyncio.sleep(4)
                            continue
                        metrics_result = str(metrics_data)
                        print(f"✅ Metrics agent completed successfully after {attempt} attempts!")
                        break
                    else:
                        # The agent is still processing, we need to poll for results
                        print(f"Metrics agent is processing... Status: {metrics_data.get('status', 'unknown')}")
                        
                        # Poll for results indefinitely until we get a result
                        poll_interval = 4
                        poll_attempt = 0
                        
                        while True:
                            poll_attempt += 1
                            print(f"Metrics agent polling attempt {poll_attempt}")
                            await asyncio.sleep(poll_interval)
                            
                            # Make another request to check status
                            poll_response = await client.post(
                                "https://metricsagent-739298578243.us-central1.run.app/brand/metrics",
                                json={"brand_name": brand_name}
                            )
                            poll_response.raise_for_status()
                            poll_data = poll_response.json()
                            
                            # Check if research is complete
                            if poll_data.get("success") and "metrics" in poll_data:
                                # Check if the result contains an error message
                                if "error" in str(poll_data).lower() or "500" in str(poll_data):
                                    print(f"❌ Metrics agent polling returned error result, starting over...")
                                    break  # Break from polling loop to retry from beginning
                                metrics_result = str(poll_data)
                                print(f"✅ Metrics agent completed after {poll_attempt} polling attempts!")
                                break
                            elif poll_data.get("status") == "error":
                                print(f"❌ Metrics agent encountered an error, starting over...")
                                break  # Break from polling loop to retry from beginning
                            else:
                                print(f"Still processing... Status: {poll_data.get('status', 'unknown')}")
                        
                        # If we got a successful result from polling, break the main retry loop
                        if 'metrics_result' in locals():
                            break
                        
                except Exception as e:
                    print(f"❌ Metrics agent request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
                    continue
            
            # Print the metrics result
            print(f"\n=== METRICS RESULT FOR {brand_name.upper()} ===")
            print(metrics_result)
            print("=" * 50)
            
            # === 9. BOUNTY AGENT (with 1 minute delay) ===
            print(f"\n🎯 Step 9: Waiting 1 minute before calling Bounty Agent for {brand_name}...")
            print("⏰ Waiting 2.5 minutes...")
            await asyncio.sleep(150)  # Wait for 1 minute
            
            print(f"\n🎯 Calling Bounty Agent for {brand_name}...")
            
            # Simple retry logic: get bounty data or retry (max 50 attempts)
            attempt = 0
            max_attempts = 50
            bounty_result = None
            
            while attempt < max_attempts and bounty_result is None:
                attempt += 1
                try:
                    print(f"Bounty agent attempt {attempt}/{max_attempts}")
                    bounty_response = await client.get(
                        "https://bountyagent-739298578243.us-central1.run.app/bounties/auto-generated"
                    )
                    bounty_response.raise_for_status()
                    bounty_data = bounty_response.json()
                    
                    # Simple check: if we have success and auto_generated_bounties, use it
                    if bounty_data.get("success") and bounty_data.get("auto_generated_bounties"):
                        bounty_result = str(bounty_data)
                        print(f"✅ Bounty agent completed successfully after {attempt} attempts!")
                        print(f"📊 Bounty data received: {len(bounty_result)} characters")
                        break
                    else:
                        print(f"❌ Bounty agent not ready yet, retrying in 4 seconds...")
                        await asyncio.sleep(4)
                        
                except Exception as e:
                    print(f"❌ Bounty agent request failed: {e}, retrying in 4 seconds...")
                    await asyncio.sleep(4)
            
            # If we still don't have bounty data after max attempts, use empty result
            if bounty_result is None:
                print(f"❌ Bounty agent failed after {max_attempts} attempts, using empty result")
                bounty_result = '{"success": false, "error": "Max attempts exceeded", "auto_generated_bounties": {}}'
            
            # Print the bounty result
            print(f"\n=== BOUNTY RESULT FOR {brand_name.upper()} ===")
            print(bounty_result)
            print("=" * 50)
            
            print(f"\n🎉 ALL STEPS COMPLETED! Preparing final response...")
            print(f"📊 Response will include:")
            print(f"   - Web Search: {len(web_search_result)} chars")
            print(f"   - Negative Reviews: {len(negative_reviews_result)} chars") 
            print(f"   - Positive Reviews: {len(positive_reviews_result)} chars")
            print(f"   - Negative Reddit: {len(negative_reddit_result)} chars")
            print(f"   - Positive Reddit: {len(positive_reddit_result)} chars")
            print(f"   - Negative Social: {len(negative_social_result)} chars")
            print(f"   - Positive Social: {len(positive_social_result)} chars")
            print(f"   - Metrics: {len(metrics_result)} chars")
            print(f"   - Bounties: {len(bounty_result)} chars")
            
            print(f"\n🚀 Creating OrchestratorResponse object...")
            try:
                response = OrchestratorResponse(
                brand_name=brand_name,
                web_search_result=web_search_result,
                negative_reviews_result=negative_reviews_result,
                positive_reviews_result=positive_reviews_result,
                negative_reddit_result=negative_reddit_result,
                positive_reddit_result=positive_reddit_result,
                negative_social_result=negative_social_result,
                positive_social_result=positive_social_result,
                    metrics_result=metrics_result,
                    bounty_result=bounty_result,
                timestamp=datetime.now().isoformat(),
                kg_storage_status=kg_storage_status
            )
                print(f"✅ OrchestratorResponse created successfully!")
                print(f"📤 Returning response to client...")
                return response
            except Exception as e:
                print(f"❌ Error creating OrchestratorResponse: {e}")
                raise HTTPException(status_code=500, detail=f"Error creating response: {str(e)}")
        
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Agent error: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# Knowledge Graph Query Endpoints
@app.get("/kg/query_brand_data")
async def query_brand_data(brand_name: str, data_type: str = None, sentiment: str = None):
    """Query brand data from the knowledge graph."""
    try:
        results = kg_service.query_brand_data(brand_name, data_type, sentiment)
        return {"results": results, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/kg/get_brand_summary")
async def get_brand_summary(brand_name: str):
    """Get comprehensive brand summary from knowledge graph."""
    try:
        summary = kg_service.get_brand_summary(brand_name)
        return {"summary": summary, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/kg/get_all_brands")
async def get_all_brands():
    """Get all brands in the knowledge graph."""
    try:
        brands = kg_service.get_all_brands()
        return {"brands": brands, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Brand Research Orchestrator with Knowledge Graph API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Create ngrok tunnel
# public_url = ngrok.connect(8000)
print(f"🚀 Brand Research Orchestrator with Knowledge Graph is now accessible at:")
print(f"   Local: http://localhost:8080")
# print(f"   Public: {public_url}")
print(f"\n📋 Available endpoints:")
print(f"   - POST http://localhost:8080/research-brand (Start research)")
print(f"   - GET  http://localhost:8080/research-status (Check status)")
print(f"   - POST http://localhost:8080/research-brand-sync (Original sync endpoint)")
print(f"   - GET  http://localhost:8080/kg/query_brand_data")
print(f"   - GET  http://localhost:8080/kg/get_brand_summary")
print(f"   - GET  http://localhost:8080/kg/get_all_brands")
print(f"   - GET  http://localhost:8080/health")
print(f"\n🔄 How to use the simple polling mechanism:")
print(f"   1. POST to /research-brand with {{'brand_name': 'YourBrand'}}")
print(f"   2. Poll GET /research-status until you get the full results")
print(f"   3. Status will be 'processing' while working, full data when done")
# print(f"\n🔗 External agents can use the public URL to access the knowledge graph!")

# Run the server using nest_asyncio to handle the event loop issue
import nest_asyncio
nest_asyncio.apply()

import uvicorn
uvicorn.run(app, host="0.0.0.0", port=8080)