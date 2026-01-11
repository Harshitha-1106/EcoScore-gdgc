// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

// Load env variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("Gemini Key Loaded:", GEMINI_API_KEY ? "✅" : "❌");

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get("/", async (req, res) => {
  const userQuery = req.query.q || "Give me an eco-friendly tip";
  console.log("Received query:", userQuery);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userQuery }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const answer =
      result.response?.text() ||
      "Here’s a generic eco tip: Reduce plastic usage 🌱";

    console.log("Sending answer:", answer);
    res.send(answer);
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).send("Error generating eco tip 😅");
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`🌍 EcoScore backend running on port ${PORT}`)
);
