import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// 1. CORS CONFIGURATION (SIRF EK BAAR AUR SABSE UPAR)
// Extensions ke liye flexible karne ke liye origin: '*' rakhna hi sahi hoga
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Preflight OPTIONS requests ko handles karne ke liye zaroori line
app.options('*', cors());

const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.MODEL || "gemini-1.5-flash"; // Standard global name
const DEMO = String(process.env.USE_DEMO).toLowerCase() === "true";

// JSON Parsing parsing setup (CORS ke baad aana chahiye)
app.use(express.json({ limit: "300kb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const prompts = {
  summarize: `Summarize the selected text for an engineering student. Give a short summary, 3 to 5 key points, and important terms.`,
  explain: `Explain the selected text simply for a beginner and then technical meaning.`,
  grammar: `Fix grammar, spelling and punctuation. Return corrected version and important corrections.`,
  deeper: `Help the student learn deeply. Give core concepts, prerequisites, common mistakes, and interview questions.`,
  example: `Give a clear practical example. If programming-related, give a small Java example with complexities.`,
  interview: `Prepare the student for an interview. Give strong explanation, 5 questions, and common mistakes.`,
  rewrite: `Rewrite the selected text clearly and naturally keeping original meaning.`
};

function demoResponse(action, text) {
  return `Demo response for "${action}":\n\n${text}`;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, model: MODEL, demo: DEMO });
});

app.post("/api/ask", async (req, res) => {
  try {
    const { action, text, pageTitle = "", pageUrl = "", customPrompt = "" } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No selected text." });
    }

    const instruction = customPrompt?.trim() || prompts[action];
    if (!instruction) {
      return res.status(400).json({ error: "Invalid action." });
    }

    if (DEMO) {
      return res.json({ result: demoResponse(action, text), demo: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing in environment." });
    }

    const fullPrompt = `You are LearnMate, an AI learning assistant.
Job: ${instruction}
Page: ${pageTitle}
URL: ${pageUrl}
Text: """ ${text} """`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: fullPrompt
    });

    const result = response.text;
    if (!result) {
      return res.status(500).json({ error: "Gemini returned an empty response." });
    }

    res.json({ result: result, demo: false });

  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error?.message || "Gemini API request failed." });
  }
});

app.listen(PORT, () => {
  console.log(`LearnMate backend running at port ${PORT}`);
});
