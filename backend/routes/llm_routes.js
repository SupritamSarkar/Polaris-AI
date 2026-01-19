import express from "express";
import multer from "multer";
import { getHuggingFaceCompletion } from "../llm_config.js";

const router = express.Router();

// Configure Multer (Store files in memory to process them immediately)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/chat", upload.array("attachments"), async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const files = req.files || [];

    // Parse history back to object if sent as stringified JSON
    let parsedHistory = [];
    try {
        if (typeof history === "string") {
            parsedHistory = JSON.parse(history);
        } else if (Array.isArray(history)) {
            parsedHistory = history;
        }
    } catch (parseError) {
        console.warn("Failed to parse history:", parseError);
        parsedHistory = []; // Fallback to empty history
    }

    // Call the LLM service with files
    const response = await getHuggingFaceCompletion(prompt, parsedHistory, files);
    
    res.json({ result: response });

  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
