// api/tts.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": "Bearer YOUR_OPENAI_API_KEY",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text
      }),
    });

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "TTS request failed" });
  }
}
