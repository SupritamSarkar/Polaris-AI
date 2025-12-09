"""
Agentic Workflow System with Four Agents (API-Based)
=====================================================
This script implements a complete end-to-end agentic workflow for a chatbot
that can either answer general questions or perform RAG-based event search.

This version is modified to use API endpoints for model inference
instead of loading the models locally, based on the server-side
concept provided.

Agents:
1. Decider Agent - Routes queries
2. Query Answering Agent - Generates conversational responses
3. RAG Search Agent - Performs vector search
4. Synthesizer Agent - Formats final output

Technical Stack (API-Based):
- LLM: Llama 3.1 8B Instruct (via Hugging Face API Router)
- Embeddings: E5 Large Multilingual (via Hugging Face API Router)
- Database: Mock MongoDB (in-memory Python list)
"""

import json
import re
import os
from typing import List, Dict, Any
import warnings
from dotenv import load_dotenv
from openai import OpenAI  # We use the OpenAI client to talk to the HF Router
from huggingface_hub import InferenceClient
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import numpy as np
from pymongo import MongoClient # <-- ADD THIS LINE
# Load environment variables from .env file
current_dir = r"C:\Users\Aparup Ghosh\Desktop\Hacksprint\3-SUM\chatbot"
dotenv_path = os.path.join(current_dir, '.env')
load_dotenv(dotenv_path)
# print(f"Loading .env from: {dotenv_path}")
warnings.filterwarnings('ignore')

# =============================================================================
# SECTION 1: API CLIENT AND MODEL INITIALIZATION
# =============================================================================

print("=" * 80)
print("INITIALIZING API CLIENTS...")
print("=" * 80)

# Get Hugging Face Access Token from environment
HF_TOKEN = os.getenv("HF_ACCESS_TOKEN")
if not HF_TOKEN:
    raise ValueError("HF_ACCESS_TOKEN environment variable not set. Please create a .env file.")

# 1. Initialize the client, pointing to the Hugging Face Router
# This is the Python equivalent of the setup in llm_config.js
try:
    client = OpenAI(
        # --- MODIFICATION ---
        # Updated to use the HF Router endpoint as seen in llm_config.js
        base_url="https://router.huggingface.co/v1", 
        # --- END MODIFICATION ---
        api_key=HF_TOKEN,
    )
    hf_inference_client = InferenceClient(api_key=HF_TOKEN)
except Exception as e:
    print(f"Failed to initialize OpenAI client for HF: {e}")
    exit()

# 2. Define Model IDs to be used in API calls
# The HF_MODEL in your .env should be this
LLM_MODEL_ID = "meta-llama/Llama-3.1-8B-Instruct:novita"
EMBEDDING_MODEL_ID = "intfloat/multilingual-e5-large"

print(f"✓ API Client initialized for LLM ({LLM_MODEL_ID})")
print(f"✓ API Client initialized for Embeddings ({EMBEDDING_MODEL_ID})")


def get_embedding(text: str, model: str) -> np.ndarray:
    """Helper function to get embeddings via API."""
    try:
        # The E5 model *does not* need the "passage:" prefix
        # when called with the native InferenceClient.
        
        # API expects a list
        response = hf_inference_client.feature_extraction(
            text=[text],
            model=model
        )
        # The response is a list of embeddings (as lists)
        embedding = response[0]
        return np.array(embedding)
    except Exception as e:
        print(f"Error getting embedding: {e}")
        # Return a zero vector on failure
        return np.zeros(1024) # e5-large has 1024 dimensions



# =============================================================================
# SECTION 2: MONGODB DATABASE CONNECTION
# =============================================================================

print("\nCONNECTING TO MONGODB...")
print("=" * 80)

# --- Configuration ---
# !! IMPORTANT: Change these values to match your database !!
YOUR_DATABASE_NAME = "test"  #  "hacksprint", etc.
YOUR_COLLECTION_NAME = "events"    # The name of your collection holding the events
# ---------------------

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set.")

try:
    # 1. Connect to MongoDB
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[YOUR_DATABASE_NAME]
    collection = db[YOUR_COLLECTION_NAME]
    
    # 2. Fetch all event documents from the collection
    # We use list() to execute the query and get all documents
    # We remove the '_id' field as it's not needed and can cause issues
    MOCK_EVENTS = list(collection.find({}, {"_id": 0}))
    
    if not MOCK_EVENTS:
        print(f"Warning: Fetched 0 events from '{YOUR_DATABASE_NAME}.{YOUR_COLLECTION_NAME}'.")
    else:
        print(f"✓ Successfully fetched {len(MOCK_EVENTS)} events from MongoDB.")

except Exception as e:
    print(f"\n!!! FAILED TO CONNECT TO MONGODB: {e}")
    print("Falling back to an empty list. RAG search will not work.")
    MOCK_EVENTS = []


# --- Generate embeddings for all events via API ---
# (This existing logic now runs on the data pulled from MongoDB)
print("\nGenerating embeddings for event descriptions (via API)...")

for event in MOCK_EVENTS:
    # Combine title and description for richer embeddings
    # Ensure your documents in MongoDB have 'title' and 'description' fields
    try:
        text_to_embed = f"passage: {event['title']}. {event['description']}"
        # This now calls the API
        event['embedding'] = get_embedding(text_to_embed, model=EMBEDDING_MODEL_ID)
    except KeyError as e:
        print(f"Warning: Skipping event. Missing expected key {e} in document: {event}")
    except Exception as e:
        print(f"Warning: Skipping event. Error generating embedding: {e}")


# This variable now holds the events from MongoDB + their embeddings
mock_mongodb_collection = MOCK_EVENTS

print(f"✓ Created in-memory database with {len(mock_mongodb_collection)} events")
print("✓ All event embeddings pre-computed via API")
print("=" * 80)
# =============================================================================
# SECTION 3: AGENT IMPLEMENTATIONS (API-BASED)
# =============================================================================

# -----------------------------------------------------------------------------
# Agent 1: Decider Agent
# -----------------------------------------------------------------------------

def decider_agent(user_query: str) -> Dict[str, str]:
    """
    Decider Agent: Routes the user query to appropriate handler via API call.
    """
    print("\n" + "=" * 80)
    print("AGENT 1: DECIDER AGENT")
    print("=" * 80)
    print(f"Input: {user_query}")

    # System prompt for intent classification
    system_prompt = """You are an intent classification assistant. Your job is to analyze user queries and determine if they are:
1. RAG_SEARCH - Questions about events, schedules, locations, recommendations, or anything event-related
2. NATURAL_LANGUAGE - General conversation, greetings, factual questions not related to events

You MUST respond with ONLY a JSON object in this exact format:
{"action": "RAG_SEARCH", "query": "refined search terms"}
OR
{"action": "NATURAL_LANGUAGE", "query": "original user query"}

For RAG_SEARCH, extract and refine the key search terms. For NATURAL_LANGUAGE, keep the original query.

Examples:
User: "What events are happening in December?"
Response: {"action": "RAG_SEARCH", "query": "events December"}

User: "Hello, how are you?"
Response: {"action": "NATURAL_LANGUAGE", "query": "Hello, how are you?"}

User: "Find me a workshop on machine learning"
Response: {"action": "RAG_SEARCH", "query": "machine learning workshop"}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]

    # --- MODIFIED: API Call ---
    try:
        chat_completion = client.chat.completions.create(
            model=LLM_MODEL_ID,
            messages=messages,
            max_tokens=150,
            temperature=0.1,
            response_format={"type": "json_object"}, # Request JSON output
        )
        assistant_response = chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        assistant_response = "{}" # Empty JSON on failure
    # --- END MODIFICATION ---

    print(f"\nRaw LLM Output: {assistant_response}")

    # Parse JSON from response
    try:
        result = json.loads(assistant_response)
        
        # Validate schema
        if "action" not in result or "query" not in result:
            raise ValueError("Missing required fields")
        if result["action"] not in ["RAG_SEARCH", "NATURAL_LANGUAGE"]:
            raise ValueError("Invalid action type")

    except (json.JSONDecodeError, ValueError) as e:
        print(f"Warning: Failed to parse JSON ({e}). Defaulting to NATURAL_LANGUAGE")
        result = {"action": "NATURAL_LANGUAGE", "query": user_query}

    print(f"\nDecision: {result['action']}")
    print(f"Processed Query: {result['query']}")

    return result


# -----------------------------------------------------------------------------
# Agent 2: Query Answering Agent
# -----------------------------------------------------------------------------

def query_answering_agent(decision: Dict[str, str]) -> str:
    """
    Query Answering Agent: Generates conversational responses via API call.
    """
    print("\n" + "=" * 80)
    print("AGENT 2: QUERY ANSWERING AGENT")
    print("=" * 80)

    query = decision["query"]
    print(f"Input Query: {query}")

    system_prompt = """You are a helpful, friendly assistant. Provide concise, accurate, and conversational responses to user queries. Be polite and helpful."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query}
    ]

    # --- MODIFIED: API Call ---
    try:
        chat_completion = client.chat.completions.create(
            model=LLM_MODEL_ID,
            messages=messages,
            max_tokens=200,
            temperature=0.7,
        )
        assistant_response = chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        assistant_response = "Sorry, I'm having trouble connecting right now."
    # --- END MODIFICATION ---

    print(f"\nGenerated Response: {assistant_response}")

    return assistant_response


# -----------------------------------------------------------------------------
# Agent 3: RAG Search Agent
# -----------------------------------------------------------------------------

def rag_search_agent(decision: Dict[str, str], top_k: int = 3) -> List[Dict[str, Any]]:
    """
    RAG Search Agent: Performs vector search on event database (uses API for query embedding).
    """
    print("\n" + "=" * 80)
    print("AGENT 3: RAG SEARCH AGENT")
    print("=" * 80)

    query = decision["query"]
    print(f"Search Query: {query}")

    # --- MODIFIED: API Call for Embedding ---
    # For E5 models, prefix with "query: " for search queries
    query_text = f"query: {query}"
    query_embedding = get_embedding(query_text, model=EMBEDDING_MODEL_ID)
    # --- END MODIFICATION ---

    print(f"✓ Generated query embedding via API (dim={len(query_embedding)})")

    # Step 2: Calculate cosine similarity with all events
    print(f"\nSearching through {len(mock_mongodb_collection)} events...")

    similarities = []
    for idx, event in enumerate(mock_mongodb_collection):
        # Reshape for sklearn cosine_similarity
        sim = cosine_similarity(
            query_embedding.reshape(1, -1),
            event['embedding'].reshape(1, -1)
        )[0][0]
        similarities.append((idx, sim))

    # Step 3: Sort by similarity (descending) and get top-k
    similarities.sort(key=lambda x: x[1], reverse=True)
    top_indices = [idx for idx, _ in similarities[:top_k]]

    # Step 4: Retrieve full event documents
    top_events = []
    for idx in top_indices:
        event = mock_mongodb_collection[idx].copy()
        # Remove embedding from result (not needed in output)
        event.pop('embedding', None)
        top_events.append(event)

    print(f"\n✓ Found top {top_k} relevant events:")
    for i, (idx, score) in enumerate(similarities[:top_k], 1):
        print(f"  {i}. {mock_mongodb_collection[idx]['title']} (similarity: {score:.4f})")

    return top_events


# -----------------------------------------------------------------------------
# Agent 4: Synthesizer Agent
# -----------------------------------------------------------------------------

def synthesizer_agent(agent_output: Any, output_type: str) -> str:
    """
    Synthesizer Agent: Formats final response for user display.
    (This agent's logic remains unchanged as it only formats data)
    """
    print("\n" + "=" * 80)
    print("AGENT 4: SYNTHESIZER AGENT")
    print("=" * 80)
    print(f"Input Type: {output_type}")

    if output_type == "text":
        # Simple text response - just format nicely
        formatted = f"\n{agent_output}\n"
        print("✓ Formatted text response")

    elif output_type == "events":
        # Event list - create Markdown-formatted output
        events = agent_output

        if not events:
            formatted = "\nI couldn't find any events matching your query. Please try a different search.\n"
        else:
            formatted = f"\n🎉 I found {len(events)} event(s) for you!\n\n"
            for i, event in enumerate(events, 1):
                # Use .get() to safely access keys.
                # If a key doesn't exist, it will use 'N/A' instead of crashing.
                title = event.get('title', 'No Title')
                link = event.get('booking_link', '#') # Use '#' as a safe fallback link
                date = event.get('date', 'N/A')
                location = event.get('location', 'N/A')
                description = event.get('description', 'No description available.')

                formatted += f"**{i}. [{title}]({link})**\n"
                formatted += f"   📅 Date: {date}\n"
                formatted += f"   📍 Location: {location}\n"
                formatted += f"   📝 Description: {description}\n\n"
            # for i, event in enumerate(events, 1):
            #     formatted += f"**{i}. [{event['title']}]({event['booking_link']})**\n"
            #     formatted += f"   📅 Date: {event['date']}\n"
            #     formatted += f"   📍 Location: {event['location']}\n"
            #     formatted += f"   📝 Description: {event['description']}\n\n"

        print(f"✓ Formatted {len(events)} events with Markdown links")

    else:
        formatted = "\nError: Unknown output type\n"

    return formatted


# =============================================================================
# SECTION 4: ORCHESTRATOR
# =============================================================================

def orchestrator(user_query: str) -> str:
    """
    Main orchestrator function that manages the agentic workflow.
    (This agent's logic remains unchanged)
    """
    print("\n")
    print("=" * 80)
    print("AGENTIC WORKFLOW ORCHESTRATOR")
    print("=" * 80)
    print(f"User Query: '{user_query}'")

    # Step 1: Route the query
    decision = decider_agent(user_query)

    # Step 2: Process based on decision
    if decision["action"] == "RAG_SEARCH":
        # Use RAG Search Agent
        search_results = rag_search_agent(decision)
        final_response = synthesizer_agent(search_results, output_type="events")

    else:  # NATURAL_LANGUAGE
        # Use Query Answering Agent
        answer = query_answering_agent(decision)
        final_response = synthesizer_agent(answer, output_type="text")

    print("\n" + "=" * 80)
    print("WORKFLOW COMPLETE")
    print("=" * 80)

    return final_response


# =============================================================================
# SECTION 5: EXAMPLE USAGE
# =============================================================================

if __name__ == "__main__":
    print("\n\n")
    print("#" * 80)
    print("# EXAMPLE USAGE - DEMONSTRATING BOTH WORKFLOW PATHS (API-BASED)")
    print("#" * 80)

    # Example 1: RAG Search Query
    print("\n\n" + "▶" * 40)
    print("EXAMPLE 1: RAG SEARCH QUERY")
    print("▶" * 40)

    query1 = "I'm looking for a workshop on machine learning or AI"
    result1 = orchestrator(query1)

    print("\n" + "─" * 80)
    print("FINAL OUTPUT FOR USER:")
    print("─" * 80)
    print(result1)

    # Example 2: Natural Language Query
    print("\n\n" + "▶" * 40)
    print("EXAMPLE 2: NATURAL LANGUAGE QUERY")
    print("▶" * 40)

    query2 = "Hello! What can you help me with?"
    result2 = orchestrator(query2)

    print("\n" + "─" * 80)
    print("FINAL OUTPUT FOR USER:")
    print("─" * 80)
    print(result2)

    # Example 3: Another RAG Search Query
    print("\n\n" + "▶" * 40)
    print("EXAMPLE 3: RAG SEARCH WITH LOCATION")
    print("▶" * 40)

    query3 = "What events are happening in December?"
    result3 = orchestrator(query3)

    print("\n" + "─" * 80)
    print("FINAL OUTPUT FOR USER:")
    print("─" * 80)
    print(result3)

    print("\n\n" + "#" * 80)
    print("# ALL EXAMPLES COMPLETED")
    print("#" * 80)
    print("\n✓ The agentic workflow system is functioning correctly!")
    print("✓ Both RAG search and natural language paths demonstrated")
    print("\n" + "#" * 80)