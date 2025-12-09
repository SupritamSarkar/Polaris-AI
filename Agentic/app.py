import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- IMPORT YOUR AGENTIC WORKFLOW ---
# We import the 'orchestrator' function from your existing script.
# When this import runs, all the global code in your script
# (loading .env, initializing API clients, creating the mock DB)
# will execute *once*, which is perfect.
try:
    from agentic_workflow_system import orchestrator
    print("✓ Agentic workflow orchestrator imported successfully.")
    print("✓ Models and mock database are pre-loaded.")
except ImportError:
    print("Error: Could not import 'orchestrator' from 'agentic_workflow_system.py'")
    print("Please make sure 'app.py' is in the same directory as 'agentic_workflow_system.py'")
    exit()
except Exception as e:
    print(f"An error occurred during initial import and setup: {e}")
    exit()

# --- FLASK APP SETUP ---
app = Flask(__name__)

# This is CRITICAL for your React app.
# It allows requests from http://localhost:3000 (your frontend)
# to http://localhost:5000 (this backend).
CORS(app)

# --- API ENDPOINT ---
@app.route("/api/chat", methods=["POST"])
def handle_chat():
    """
    API endpoint to receive a user query and return the agentic response.
    """
    
    # 1. Get the user's query from the request JSON
    # We expect a body like: {"query": "Hello there!"}
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "Invalid request. 'query' field is missing."}), 400

    user_query = data.get("query")
    if not user_query:
        return jsonify({"error": "Invalid request. 'query' cannot be empty."}), 400

    print(f"\n[API Request] Received query: {user_query}")

    try:
        # 2. Call your existing orchestrator function
        # All the print() statements from your orchestrator
        # will show up in the Flask terminal, which is great for debugging.
        final_response = orchestrator(user_query)

        # 3. Return the response as JSON
        # It will look like: {"response": "Hello! I am..."}
        return jsonify({"response": final_response})

    except Exception as e:
        # 4. Handle any unexpected errors during the workflow
        print(f"\n[API Error] An unhandled exception occurred: {e}\n")
        print(f"[API Error] An error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# --- RUN THE APP ---
if __name__ == "__main__":
    # Runs the Flask server
    # host='0.0.0.0' makes it accessible on your local network
    # port=5000 is a standard port for development backends
    print("\nStarting Flask API server at http://localhost:5000")
    print("Press CTRL+C to stop")
    app.run(host='0.0.0.0', port=5000, debug=True)