// api/tts.js

export const config = {
  runtime: "nodejs18.x", // ✅ نأكد إن Vercel يستخدم Node وليس Edge
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // دعم كل الطرق لقراءة النص
    const body = req.body || {};
    const text = body.text || (await req.json?.())?.text;
    if (!text) return res.status(400).json({ error: "Missing text" });

    // استدعاء API الصوت من OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("TTS Error:", err);
      return res.status(500).json({ error: "TTS failed", details: err });
    }

    // تحويل الصوت إلى ملف MP3
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
