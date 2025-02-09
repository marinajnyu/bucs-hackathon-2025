require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    console.log(`📥 Received: ${req.method} ${req.url}`);
    console.log("Request Body:", req.body);
    next();
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/translate", async (req, res) => {
    try {
        const { text, tone } = req.body;
        
        console.log("✅ Received Data:", { text, tone });

        if (!text || !tone) {
            console.log("❌ Missing parameters");
            return res.status(400).json({ error: "Missing parameters" });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5",
            messages: [
                { role: "system", content: `You are an AI that rewrites text in a ${tone} tone.` },
                { role: "user", content: `Rewrite this in a ${tone} tone: "${text}"` }
            ]
        });

        console.log("✅ OpenAI Response:", response.choices[0].message.content);
        res.json({ translatedText: response.choices[0].message.content });
    } catch (error) {
        console.error("❌ OpenAI API Error:", error);
        res.status(500).json({ error: "OpenAI API error" });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));