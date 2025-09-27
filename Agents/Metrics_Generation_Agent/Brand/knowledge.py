# knowledge.py
from hyperon import MeTTa, E, S, ValueAtom

def initialize_knowledge_graph(metta: MeTTa):
    """Initialize the MeTTa knowledge graph with brand research data structure."""
    # Brand relationships
    metta.space().add_atom(E(S("brand_has"), S("brand"), S("web_results")))
    metta.space().add_atom(E(S("brand_has"), S("brand"), S("reddit_threads")))
    metta.space().add_atom(E(S("brand_has"), S("brand"), S("reviews")))
    metta.space().add_atom(E(S("brand_has"), S("brand"), S("social_comments")))
    
    # Sentiment relationships
    metta.space().add_atom(E(S("has_sentiment"), S("reddit_threads"), S("positive")))
    metta.space().add_atom(E(S("has_sentiment"), S("reddit_threads"), S("negative")))
    metta.space().add_atom(E(S("has_sentiment"), S("reviews"), S("positive")))
    metta.space().add_atom(E(S("has_sentiment"), S("reviews"), S("negative")))
    metta.space().add_atom(E(S("has_sentiment"), S("social_comments"), S("positive")))
    metta.space().add_atom(E(S("has_sentiment"), S("social_comments"), S("negative")))
    
    # FAQ entries for brand research
    metta.space().add_atom(E(S("faq"), S("Hi"), ValueAtom("Hello! I'm your brand research assistant. I can help you analyze brands, find reviews, sentiment analysis, and more!")))
    metta.space().add_atom(E(S("faq"), S("What brands do you have data for?"), ValueAtom("I can query our knowledge graph to find all available brands. Would you like me to check?")))
    metta.space().add_atom(E(S("faq"), S("How do I research a brand?"), ValueAtom("Just ask me about any brand! I can provide web results, reviews, Reddit discussions, and social media sentiment analysis.")))
    metta.space().add_atom(E(S("faq"), S("What can you tell me about brand sentiment?"), ValueAtom("I can analyze positive and negative sentiment from reviews, Reddit threads, and social media comments for any brand.")))