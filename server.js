import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Serve your static site from /public (index.html lives there)
app.use(express.static("public"));

// === Model proxy (keeps your key secret) ==================
// Default: Groq's OpenAI-compatible endpoint.
// Swap API_BASE + secret name if you use a different provider.
const API_BASE = "https://api.groq.com/openai/v1";
const API_KEY  = process.env.GROQ_API_KEY;

app.post("/api/chat", async (req, res) => {
  try {
    const payload = {
      model: req.body.model || "llama-3.3-70b-versatile",
      messages: req.body.messages || [{ role: "user", content: "Say hi." }],
      temperature: req.body.temperature ?? 0.7,
      max_tokens: req.body.max_tokens ?? 512,
      stream: false
    };

    const r = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text().catch(()=> "");
      return res.status(r.status).json({ ok:false, error: text || r.statusText });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    res.json({ ok:true, text, raw:data });
  } catch (e) {
    res.status(500).json({ ok:false, error: e?.message || "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`IT+ proxy live on ${PORT}`));
