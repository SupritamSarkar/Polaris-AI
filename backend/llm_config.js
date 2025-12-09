import dotenv from "dotenv";
dotenv.config();
import OpenAI from 'openai';

const apiKey = process.env.HF_ACCESS_TOKEN || process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('Missing OpenAI/HF API key.');

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: apiKey,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant and a helper/mentor. 
- If images are provided, analyze them based on the user's prompt. 
- If code or text files are provided, use their content as context to answer. 
- Be specific and answer every question(don't say i can't answer this question)
- use emojis, be genz`;

export async function getHuggingFaceCompletion(prompt, history = [], files = []) {
    
    // 1. Prepare the User Message Content Array
    let userMessageContent = [
        { type: "text", text: prompt }
    ];

    // 2. Process Files
    for (const file of files) {
        const base64 = file.buffer.toString('base64');
        const mimeType = file.mimetype;

        if (mimeType.startsWith('image/')) {
            // --- IMAGE HANDLING (Vision) ---
            userMessageContent.push({
                type: "image_url",
                image_url: {
                    // Standard OpenAI format: "data:image/jpeg;base64,..."
                    url: `data:${mimeType};base64,${base64}`
                }
            });
        } else if (
            mimeType.startsWith('text/') || 
            mimeType.includes('json') || 
            mimeType.includes('javascript') ||
            mimeType.includes('xml')
        ) {
            // --- TEXT FILE HANDLING (Context Injection) ---
            // We decode the buffer to text and add it to the prompt
            const fileContent = file.buffer.toString('utf-8');
            userMessageContent.push({
                type: "text",
                text: `\n\n--- FILE CONTENT (${file.originalname}) ---\n${fileContent}\n--- END FILE ---\n`
            });
        }
    }

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessageContent } // Send Array instead of String
    ];

    try {
        const chatCompletion = await client.chat.completions.create({
            model: process.env.HF_MODEL, 
            messages: messages,
            temperature: 0.7, 
            max_tokens: 2048,
        });
        
        return chatCompletion.choices[0].message.content;

    } catch (error) {
        console.error("Hugging Face Router Error:", error);
        throw new Error("Failed to get response from LLM via HF Router.");
    }
}