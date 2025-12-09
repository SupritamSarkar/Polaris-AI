import os
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv  
from huggingface_hub import InferenceClient  
import warnings 

# --- 1. Load Environment Variables (from agentic_workflow_system.py) ---
# This path points to your .env file in the 'chatbot' directory
current_dir = r"C:\Users\Aparup Ghosh\Desktop\Hacksprint\3-SUM\chatbot"
dotenv_path = os.path.join(current_dir, '.env')
load_dotenv(dotenv_path)
print(f"Loading .env from: {dotenv_path}")
warnings.filterwarnings('ignore')

# --- 2. Initialize Flask App ---
app = Flask(__name__)

# --- 3. Configure Hugging Face API (Modified) ---
# Get token from the .env file (using the var name from your .env)
HF_API_TOKEN = os.environ.get("HF_ACCESS_TOKEN")

# Define the model ID from your screenshot
MODEL_ID = "siebert/sentiment-roberta-large-english"

# Initialize the Hugging Face InferenceClient
try:
    hf_client = InferenceClient(api_key=HF_API_TOKEN)
    print(f"✓ Hugging Face InferenceClient initialized for: {MODEL_ID}")
except Exception as e:
    print(f"Failed to initialize InferenceClient: {e}")
    hf_client = None

# --- 4. Mock Database (for the GET endpoint) ---
MOCK_COMMENTS_DB = [
    "The keynote speaker was absolutely amazing!",
    "Loved the networking opportunities. Met so many great people.",
    "Registration was a nightmare. Waited in line for an hour.",
    "The wifi connection was terrible, couldn't get any work done.",
    "Food was cold and very disappointing.",
    "Great sessions, especially the one on AI.",
    "The venue was easy to find.",
    "Helpful staff, they really knew what they were doing.",
    "I wish the sessions were longer.",
    "The after-party was a lot of fun!"
]

# --- 5. Helper Function to Call Hugging Face (Modified) ---
def query_sentiment_api(text_input):
    """
    Sends text to the Hugging Face API for sentiment analysis.
    Uses the text_classification method as shown in the screenshot.
    """
    if not hf_client:
        return {"error": "Hugging Face client not initialized."}, 500

    try:
        # Call the text_classification method
        response = hf_client.text_classification(
            text=text_input,
            model=MODEL_ID
        )
        # Response for a single string is: [{'label': 'POSITIVE', 'score': 0.99}]
        return response, 200
    except Exception as e:
        return {"error": f"Hugging Face API Error: {str(e)}"}, 500


# --- 6. API Endpoint 1: GET Comments ---
@app.route("/comments", methods=["GET"])
def get_comments():
    """
    Returns a predefined list of comments as an array.
    """
    return jsonify({"comments": MOCK_COMMENTS_DB})


# --- 7. API Endpoint 2: POST and Analyze Comments (Modified) ---
@app.route("/analyze", methods=["POST"])
def analyze_comments():
    """
    Receives an array of comments and returns sentiment analysis for each one.
    """
    # Check if the API token is configured on the server
    if not HF_API_TOKEN:
        return jsonify({"error": "Server configuration error: HF_ACCESS_TOKEN is not set."}), 500

    # Get the JSON data from the POST request
    data = request.get_json()

    # Validate the input
    if not data or 'comments' not in data or not isinstance(data['comments'], list):
        return jsonify({"error": "Invalid input. Expected JSON: {'comments': [...]}"}), 400
    
    comments = data['comments']
    if not comments:
        return jsonify({"error": "No comments provided."}), 400

    # --- New Logic: Analyze each comment ---
    results = []
    for comment in comments:
        api_response, status_code = query_sentiment_api(comment)

        if status_code != 200:
            # Add error for this specific comment
            results.append({"comment": comment, "analysis": api_response})
        else:
            # Add successful analysis
            # api_response is a List[Dict], e.g., [{'label': 'POSITIVE', 'score': 0.99}]
            results.append({"comment": comment, "analysis": api_response})

    # Return the list of all results
    return jsonify({"results": results})


# --- 8. Run the App ---
if __name__ == "__main__":
    # Starts the web server on http://127.0.0.1:5000
    # The 'debug=True' reloader will use the PIN 498-085-439
    app.run(debug=True)