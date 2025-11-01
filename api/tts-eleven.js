export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "Missing text" });

  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing ELEVEN_API_KEY" });

  try {
    // ✅ تحديث الرابط للطراز الجديد من ElevenLabs
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB/stream", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.7 }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ ElevenLabs Error:", err);
      return res.status(500).json({ error: "TTS failed", details: err });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    // 👇 السماح لصفحة GitHub Pages بطلب الصوت
    res.setHeader("Access-Control-Allow-Origin", "https://dns3uae-glitch.github.io");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.status(200).send(audioBuffer);

  } catch (error) {
    console.error("⚠️ Server error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
