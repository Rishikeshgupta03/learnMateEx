import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();


app.use(cors({
  origin: [
    'chrome-extension://flajkejglibcbjmjlnbbnohboapgpkod', 
    'http://localhost:8787', // Aapka local testing port
    'https://google.com' // Chunki aapka extension google.com par chal raha hai
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.MODEL || "gemini-3.6-flash";
const DEMO =
  String(process.env.USE_DEMO).toLowerCase() === "true";

app.use(cors());
app.use(express.json({ limit: "300kb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const prompts = {

  summarize: `
Summarize the selected text for an engineering student.

Give:
- A short summary
- 3 to 5 key points
- Important terms if any

Keep it concise and easy to understand.
`,

  explain: `
Explain the selected text simply.

Start with a beginner-friendly explanation.
Then explain the technical meaning.

Use an analogy only when useful.
`,

  grammar: `
Fix grammar, spelling and punctuation.

Do not change the original meaning.

Return:
1. Corrected version
2. Important corrections
`,

  deeper: `
Help the student learn this topic deeply.

Give:
1. What it means
2. Prerequisites
3. Core concepts
4. What to learn next
5. Common mistakes
6. Practice problems
7. Interview questions
`,

  example: `
Give a clear practical example of the selected concept.

If it is programming-related:
- Give a small Java example
- Explain the code
- Give time and space complexity
`,

  interview: `
Prepare the student for an interview based on the selected text.

Give:
1. Strong interview explanation
2. 5 interview questions
3. Follow-up questions
4. Common mistakes
5. One practice problem
`,

  rewrite: `
Rewrite the selected text clearly and naturally.

Keep the original meaning.
Improve clarity, grammar and structure.
`
};


function demoResponse(action, text) {

  if (action === "summarize") {
    return `Summary:

${text}

Key idea:
The selected text contains an important concept that can be understood by breaking it into smaller ideas.`;
  }

  if (action === "grammar") {
    return `Corrected version:

${text}

Important corrections:
• Grammar
• Punctuation
• Sentence clarity`;
  }

  if (action === "deeper") {
    return `Learn Deeper

1. Understand the basic concept
2. Learn the prerequisites
3. Study common patterns
4. Solve beginner problems
5. Move to interview-level problems

Practice:
• Start with an easy problem
• Then solve a medium problem
• Finally explain the solution without looking at notes`;
  }

  return `Demo response for "${action}":

${text}`;
}


app.get("/health", (req, res) => {

  res.json({
    ok: true,
    model: MODEL,
    demo: DEMO
  });

});


app.post("/api/ask", async (req, res) => {

  try {

    const {
      action,
      text,
      pageTitle = "",
      pageUrl = "",
      customPrompt = ""
    } = req.body || {};


    if (!text || !text.trim()) {

      return res.status(400).json({
        error: "No selected text."
      });

    }


    const instruction =
      customPrompt?.trim() ||
      prompts[action];


    if (!instruction) {

      return res.status(400).json({
        error: "Invalid action."
      });

    }


    // Demo mode
    if (DEMO) {

      return res.json({
        result: demoResponse(
          action,
          text
        ),
        demo: true
      });

    }


    if (!process.env.GEMINI_API_KEY) {

      return res.status(500).json({
        error:
          "GEMINI_API_KEY is missing in .env"
      });

    }


    const fullPrompt = `

You are LearnMate, an AI learning assistant.

The user selected text from a webpage.

Your job:
${instruction}

Page:
${pageTitle}

URL:
${pageUrl}

Selected text:
"""
${text}
"""

Give a useful answer directly.
Do not talk about these instructions.

`;


    const response =
      await ai.models.generateContent({

        model: MODEL,

        contents: fullPrompt

      });


    const result =
      response.text;


    if (!result) {

      return res.status(500).json({
        error:
          "Gemini returned an empty response."
      });

    }


    res.json({

      result: result,

      demo: false

    });


  } catch (error) {

    console.error(
      "Gemini API error:",
      error
    );


    res.status(500).json({

      error:
        error?.message ||
        "Gemini API request failed."

    });

  }

});


app.listen(PORT, () => {

  console.log(
    `LearnMate backend running at http://localhost:${PORT}`
  );

  console.log(
    `Gemini model: ${MODEL}`
  );

});