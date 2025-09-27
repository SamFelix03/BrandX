import json
from openai import OpenAI
from .brandrag import BrandRAG

class LLM:
    def __init__(self, api_key):
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

def get_intent_and_keyword(query, llm):
    """Use ASI:One API to classify intent and extract a keyword."""
    prompt = (
        f"Given the query: '{query}'\n"
        "Classify the intent as one of: 'brand_research', 'sentiment_analysis', 'competitor_analysis', 'faq', or 'unknown'.\n"
        "Extract the most relevant keyword (e.g., a brand name) from the query.\n"
        "Return *only* the result in JSON format like this, with no additional text:\n"
        "{\n"
        "  \"intent\": \"<classified_intent>\",\n"
        "  \"keyword\": \"<extracted_keyword>\"\n"
        "}"
    )
    response = llm.create_completion(prompt)
    try:
        result = json.loads(response)
        return result["intent"], result["keyword"]
    except json.JSONDecodeError:
        print(f"Error parsing ASI:One response: {response}")
        return "unknown", None

def generate_knowledge_response(query, intent, keyword, llm):
    """Use ASI:One to generate a response for new knowledge based on intent."""
    if intent == "brand_research":
        prompt = (
            f"Query: '{query}'\n"
            "This is a new brand research question not in my knowledge base. Provide a helpful response about brand research.\n"
            "Return *only* the answer, no additional text."
        )
    elif intent == "sentiment_analysis":
        prompt = (
            f"Query: '{query}'\n"
            "This is a sentiment analysis question not in my knowledge base. Provide helpful information about sentiment analysis.\n"
            "Return *only* the answer, no additional text."
        )
    elif intent == "competitor_analysis":
        prompt = (
            f"Query: '{query}'\n"
            "This is a competitor analysis question not in my knowledge base. Provide helpful information about competitor analysis.\n"
            "Return *only* the answer, no additional text."
        )
    elif intent == "faq":
        prompt = (
            f"Query: '{query}'\n"
            "This is a new FAQ not in my knowledge base. Provide a concise, helpful answer.\n"
            "Return *only* the answer, no additional text."
        )
    else:
        return None
    return llm.create_completion(prompt)

def process_query(query, rag: BrandRAG, llm: LLM):
    intent, keyword = get_intent_and_keyword(query, llm)
    print(f"Intent: {intent}, Keyword: {keyword}")
    prompt = ""

    if intent == "faq":
        faq_answer = rag.query_faq(query)
        if not faq_answer and keyword:
            new_answer = generate_knowledge_response(query, intent, keyword, llm)
            rag.add_knowledge("faq", query, new_answer)
            print(f"Knowledge graph updated - Added FAQ: '{query}' → '{new_answer}'")
            prompt = (
                f"Query: '{query}'\n"
                f"FAQ Answer: '{new_answer}'\n"
                "Humanize this for a brand research assistant with a professional tone."
            )
        elif faq_answer:
            prompt = (
                f"Query: '{query}'\n"
                f"FAQ Answer: '{faq_answer}'\n"
                "Humanize this for a brand research assistant with a professional tone."
            )
    
    elif intent == "brand_research" and keyword:
        # Get comprehensive brand data
        print(f"🔍 Fetching comprehensive brand data for: '{keyword}'")
        brand_summary = rag.get_brand_summary(keyword)
        print(f"📊 Brand summary received: {type(brand_summary)} - {bool(brand_summary)}")
        
        if brand_summary:
            print(f"📊 Brand summary keys: {list(brand_summary.keys()) if isinstance(brand_summary, dict) else 'Not a dict'}")
            
            # Extract all data types
            web_results = brand_summary.get('web_results', [])
            positive_reviews = brand_summary.get('positive_reviews', [])
            negative_reviews = brand_summary.get('negative_reviews', [])
            positive_reddit = brand_summary.get('positive_reddit', [])
            negative_reddit = brand_summary.get('negative_reddit', [])
            positive_social = brand_summary.get('positive_social', [])
            negative_social = brand_summary.get('negative_social', [])
            
            print(f"📊 Data counts:")
            print(f"   Web Results: {len(web_results) if web_results else 0} items")
            print(f"   Positive Reviews: {len(positive_reviews) if positive_reviews else 0} items")
            print(f"   Negative Reviews: {len(negative_reviews) if negative_reviews else 0} items")
            print(f"   Positive Reddit: {len(positive_reddit) if positive_reddit else 0} items")
            print(f"   Negative Reddit: {len(negative_reddit) if negative_reddit else 0} items")
            print(f"   Positive Social: {len(positive_social) if positive_social else 0} items")
            print(f"   Negative Social: {len(negative_social) if negative_social else 0} items")
            
            # Create comprehensive data summary for LLM
            all_data = []
            
            if web_results:
                all_data.append(f"WEB SEARCH RESULTS:\n{chr(10).join(web_results[:5])}")  # Top 5 web results
            
            if positive_reviews:
                all_data.append(f"POSITIVE REVIEWS:\n{chr(10).join(positive_reviews[:5])}")  # Top 5 positive reviews
            
            if negative_reviews:
                all_data.append(f"NEGATIVE REVIEWS:\n{chr(10).join(negative_reviews[:5])}")  # Top 5 negative reviews
            
            if positive_reddit:
                all_data.append(f"POSITIVE REDDIT DISCUSSIONS:\n{chr(10).join(positive_reddit[:5])}")  # Top 5 positive reddit
            
            if negative_reddit:
                all_data.append(f"NEGATIVE REDDIT DISCUSSIONS:\n{chr(10).join(negative_reddit[:5])}")  # Top 5 negative reddit
            
            if positive_social:
                all_data.append(f"POSITIVE SOCIAL MEDIA:\n{chr(10).join(positive_social[:5])}")  # Top 5 positive social
            
            if negative_social:
                all_data.append(f"NEGATIVE SOCIAL MEDIA:\n{chr(10).join(negative_social[:5])}")  # Top 5 negative social
            
            comprehensive_data = "\n\n".join(all_data)
            
            prompt = (
                f"Query: '{query}'\n"
                f"Brand: {keyword}\n\n"
                f"COMPREHENSIVE BRAND DATA:\n{comprehensive_data}\n\n"
                f"INSTRUCTIONS: Provide a comprehensive brand analysis report that includes:\n"
                f"1. Brand overview and market positioning\n"
                f"2. Strengths and positive aspects\n"
                f"3. Weaknesses and areas for improvement\n"
                f"4. Customer sentiment analysis across platforms\n"
                f"5. Competitive insights and market trends\n"
                f"6. Strategic recommendations for brand growth\n"
                f"7. Risk assessment and mitigation strategies\n\n"
                f"Make the analysis thorough, data-driven, and actionable with specific insights from the provided data."
            )
            print(f"📝 Generated comprehensive prompt length: {len(prompt)} characters")
        else:
            # Brand not found, suggest research
            print(f"🔍 Brand '{keyword}' not found in knowledge graph")
            all_brands = rag.get_all_brands()
            print(f"📊 Available brands in KG: {all_brands}")
            
            prompt = (
                f"Query: '{query}'\n"
                f"Brand: {keyword}\n"
                f"Available brands in knowledge graph: {', '.join(all_brands) if all_brands else 'None'}\n"
                "This brand is not in our knowledge graph yet. Suggest how to research this brand and what data sources to use."
            )
    
    elif intent == "sentiment_analysis" and keyword:
        # Get comprehensive brand data for sentiment analysis
        print(f"🔍 Fetching comprehensive brand data for sentiment analysis: '{keyword}'")
        
        # Get ALL brand data from knowledge graph
        brand_summary = rag.get_brand_summary(keyword)
        print(f"📊 Brand summary received: {type(brand_summary)} - {bool(brand_summary)}")
        
        if brand_summary:
            print(f"📊 Brand summary keys: {list(brand_summary.keys()) if isinstance(brand_summary, dict) else 'Not a dict'}")
            
            # Extract all data types
            web_results = brand_summary.get('web_results', [])
            positive_reviews = brand_summary.get('positive_reviews', [])
            negative_reviews = brand_summary.get('negative_reviews', [])
            positive_reddit = brand_summary.get('positive_reddit', [])
            negative_reddit = brand_summary.get('negative_reddit', [])
            positive_social = brand_summary.get('positive_social', [])
            negative_social = brand_summary.get('negative_social', [])
            
            print(f"📊 Data counts:")
            print(f"   Web Results: {len(web_results) if web_results else 0} items")
            print(f"   Positive Reviews: {len(positive_reviews) if positive_reviews else 0} items")
            print(f"   Negative Reviews: {len(negative_reviews) if negative_reviews else 0} items")
            print(f"   Positive Reddit: {len(positive_reddit) if positive_reddit else 0} items")
            print(f"   Negative Reddit: {len(negative_reddit) if negative_reddit else 0} items")
            print(f"   Positive Social: {len(positive_social) if positive_social else 0} items")
            print(f"   Negative Social: {len(negative_social) if negative_social else 0} items")
            
            # Create comprehensive data summary for LLM
            all_data = []
            
            if web_results:
                all_data.append(f"WEB SEARCH RESULTS:\n{chr(10).join(web_results[:3])}")  # Top 3 web results
            
            if positive_reviews:
                all_data.append(f"POSITIVE REVIEWS:\n{chr(10).join(positive_reviews[:5])}")  # Top 5 positive reviews
            
            if negative_reviews:
                all_data.append(f"NEGATIVE REVIEWS:\n{chr(10).join(negative_reviews[:5])}")  # Top 5 negative reviews
            
            if positive_reddit:
                all_data.append(f"POSITIVE REDDIT DISCUSSIONS:\n{chr(10).join(positive_reddit[:3])}")  # Top 3 positive reddit
            
            if negative_reddit:
                all_data.append(f"NEGATIVE REDDIT DISCUSSIONS:\n{chr(10).join(negative_reddit[:3])}")  # Top 3 negative reddit
            
            if positive_social:
                all_data.append(f"POSITIVE SOCIAL MEDIA:\n{chr(10).join(positive_social[:3])}")  # Top 3 positive social
            
            if negative_social:
                all_data.append(f"NEGATIVE SOCIAL MEDIA:\n{chr(10).join(negative_social[:3])}")  # Top 3 negative social
            
            comprehensive_data = "\n\n".join(all_data)
            
            prompt = (
                f"Query: '{query}'\n"
                f"Brand: {keyword}\n\n"
                f"COMPREHENSIVE BRAND DATA:\n{comprehensive_data}\n\n"
                f"INSTRUCTIONS: Provide a detailed sentiment analysis summary that includes:\n"
                f"1. Overall sentiment overview\n"
                f"2. Key positive themes and trends\n"
                f"3. Key negative themes and concerns\n"
                f"4. Platform-specific insights (reviews vs Reddit vs social media)\n"
                f"5. Actionable recommendations for brand improvement\n"
                f"6. Competitive positioning insights\n\n"
                f"Make the analysis comprehensive, data-driven, and actionable."
            )
            print(f"📝 Generated comprehensive prompt length: {len(prompt)} characters")
        else:
            # Check if the knowledge graph is accessible at all
            print(f"🔍 No brand data found, checking knowledge graph accessibility...")
            all_brands = rag.get_all_brands()
            print(f"📊 Available brands in KG: {all_brands}")
            
            if not all_brands:
                prompt = (
                    f"Query: '{query}'\n"
                    f"Brand: {keyword}\n"
                    "The knowledge graph appears to be empty or inaccessible. This could be because:\n"
                    "1. The ngrok URL is outdated or incorrect\n"
                    "2. The brand research orchestrator is not running\n"
                    "3. No brands have been researched yet\n"
                    "Please suggest how to set up the knowledge graph and research this brand."
                )
            else:
                prompt = (
                    f"Query: '{query}'\n"
                    f"Brand: {keyword}\n"
                    f"Available brands in knowledge graph: {', '.join(all_brands)}\n"
                    f"No data available for '{keyword}'. This brand hasn't been researched yet. "
                    f"Suggest how to research this brand and what data sources to use."
                )
    
    elif intent == "competitor_analysis" and keyword:
        # Get all brands and suggest competitor analysis
        all_brands = rag.get_all_brands()
        prompt = (
            f"Query: '{query}'\n"
            f"Brand: {keyword}\n"
            f"Available brands in knowledge graph: {', '.join(all_brands) if all_brands else 'None'}\n"
            "Suggest a competitor analysis approach and which brands to compare."
        )
    
    if not prompt:
        prompt = f"Query: '{query}'\nNo specific info found. Offer general brand research assistance."

    prompt += "\nFormat response as: 'Selected Question: <question>' on first line, 'Humanized Answer: <response>' on second."
    print(f"📝 Final prompt length: {len(prompt)} characters")
    print(f"📝 Final prompt preview: {prompt[:200]}...")
    
    print(f"🤖 Sending prompt to ASI:One LLM...")
    response = llm.create_completion(prompt)
    print(f"📥 LLM response received: {len(response)} characters")
    print(f"📥 LLM response preview: {response[:200]}...")
    
    try:
        # Split response into lines and find the sections
        lines = response.split('\n')
        selected_q = query  # Default to original query
        answer = response   # Default to full response
        
        # Look for "Selected Question:" and "Humanized Answer:" patterns
        for i, line in enumerate(lines):
            if "Selected Question:" in line:
                selected_q = line.replace("Selected Question:", "").strip()
            elif "Humanized Answer:" in line:
                # Get everything after "Humanized Answer:" including newlines
                answer_lines = lines[i:]
                answer_lines[0] = answer_lines[0].replace("Humanized Answer:", "").strip()
                answer = '\n'.join(answer_lines).strip()
                break
        
        print(f"✅ Parsed response successfully:")
        print(f"   Selected Question: {selected_q}")
        print(f"   Humanized Answer length: {len(answer)} characters")
        print(f"   Humanized Answer preview: {answer[:200]}...")
        
        return {"selected_question": selected_q, "humanized_answer": answer}
    except Exception as e:
        print(f"⚠️ Failed to parse LLM response format: {e}")
        print(f"   Raw response: {response[:200]}...")
        return {"selected_question": query, "humanized_answer": response}