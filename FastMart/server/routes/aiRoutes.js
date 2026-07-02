// backend/routes/aiRoutes.js
import express from 'express';
import { ChromaClient } from 'chromadb';
import { GoogleGenAI } from "@google/genai";

const router = express.Router();
const chroma = new ChromaClient({ path: "http://localhost:8800" });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/chat', async (req, res) => {
  const { userQuery } = req.body;

  try {
    // 1. Retrieve the products collection
    const collection = await chroma.getOrCreateCollection({ name: "products_catalog" });

    // 2. Semantic search closest 3 products matching user intent
    const searchResults = await collection.query({
      queryTexts: [userQuery],
      nResults: 3
    });

    // Extract the raw matching text payloads
    const docs = searchResults.documents?.[0] || [];

const retrievedProductsContext = docs.join("\n\n");

    // 3. Formulate the RAG prompt for the LLM
    const prompt = `
      You are an expert e-commerce shopping assistant. Below is a list of relevant products matching the user's inquiry from our inventory:
      
      ${retrievedProductsContext}

      User Inquiry: "${userQuery}"

      Provide a concise, helpful, and natural language response guiding the user toward the best selection. Always reference real parameters (prices, performance numbers) provided in the context.
    `;

    // 4. Fire the prompt to Gemini
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 5. Send both conversational AI response and structural reference metadata back
    res.json({
      reply: responseText,
      matches: searchResults.metadatas[0] // Helps React render clickable cards
    });

  } catch (error) {
    console.error("RAG Pipeline error:", error);
    res.status(500).json({ error: "Something went wrong processing your request." });
  }
});

export default router;
