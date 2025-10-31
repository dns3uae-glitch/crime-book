// api/tts.js
export default async function handler(request) {
  // نسمح فقط بطلبات POST
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // نقرأ النص القادم من الصفحة
  const { text } = await request.json();
  if (!text) {
    return new Response(JSON.stringify({ error: "Missing text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // نولّد الصوت من OpenAI TTS
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy", // صوت رجل واقعي
        input: text
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(err || "TTS failed", { status: 500 });
    }

    const buffer = await response.arrayBuffer();

    // نرجع الصوت للمتصفح بصيغة MP3
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg"
      }
    });

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "TTS request failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
